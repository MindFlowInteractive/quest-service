import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { CreatePreloadDataDto } from './dto/create-preload-data.dto';
import { RecordAccessDto } from './dto/record-access.dto';
import { ScheduleInvalidationDto } from './dto/schedule-invalidation.dto';
import {
  CacheJob,
  CacheJobStatus,
  CacheJobType,
} from './entities/cache-job.entity';
import { Metric, MetricName } from './entities/metric.entity';
import {
  PreloadData,
  PreloadSourceType,
  WarmWindow,
} from './entities/preload-data.entity';
import { RedisCacheService, RedisCacheStats } from './redis-cache.service';

interface WarmingJobOptions {
  name: string;
  type?: CacheJobType;
  limit?: number;
  keys?: string[];
  adaptive?: boolean;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface WarmingResult {
  jobId: string;
  status: CacheJobStatus;
  warmedKeys: number;
  skippedKeys: number;
  invalidatedKeys: number;
  durationMs: number | null;
}

interface InvalidationRequest {
  key?: string;
  keys?: string[];
  pattern?: string;
}

@Injectable()
export class CacheWarmingService
  implements OnModuleInit, OnApplicationBootstrap
{
  private readonly logger = new Logger(CacheWarmingService.name);

  constructor(
    @InjectRepository(CacheJob)
    private readonly cacheJobRepository: Repository<CacheJob>,
    @InjectRepository(PreloadData)
    private readonly preloadDataRepository: Repository<PreloadData>,
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
    private readonly redisCache: RedisCacheService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPreloadData();
  }

  async onApplicationBootstrap() {
    const warmOnStartup =
      this.configService.get<string>('CACHE_WARM_ON_STARTUP', 'true') !==
      'false';

    if (!warmOnStartup) {
      return;
    }

    try {
      await this.runWarmingJob({
        name: 'startup-popular-cache-warming',
        type: CacheJobType.WARM,
        limit: this.getDefaultWarmLimit(),
        priority: 100,
      });
    } catch (error) {
      this.logger.warn(
        `Startup cache warming skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async upsertPreloadData(dto: CreatePreloadDataDto): Promise<PreloadData> {
    const existing = await this.preloadDataRepository.findOne({
      where: { cacheKey: dto.cacheKey },
    });
    const entry =
      existing ??
      this.preloadDataRepository.create({
        cacheKey: dto.cacheKey,
        sourceType: dto.sourceType ?? PreloadSourceType.CUSTOM,
        payload: null,
        fetchUrl: null,
        tags: [],
        accessCount: 0,
        hitCount: 0,
        missCount: 0,
        popularityScore: 0,
        priority: dto.priority ?? 0,
        ttlSeconds: dto.ttlSeconds ?? 3600,
        isActive: dto.isActive ?? true,
        warmWindow: dto.warmWindow ?? WarmWindow.ALWAYS,
        lastAccessedAt: null,
        lastWarmedAt: null,
        expiresAt: null,
        invalidationIntervalSeconds: null,
        nextInvalidationAt: null,
      });

    entry.sourceType = dto.sourceType ?? entry.sourceType;
    entry.payload = dto.payload ?? entry.payload;
    entry.fetchUrl = dto.fetchUrl ?? entry.fetchUrl;
    entry.tags = dto.tags ?? entry.tags ?? [];
    entry.priority = dto.priority ?? entry.priority ?? 0;
    entry.ttlSeconds = dto.ttlSeconds ?? entry.ttlSeconds ?? 3600;
    entry.isActive = dto.isActive ?? entry.isActive ?? true;
    entry.warmWindow = dto.warmWindow ?? entry.warmWindow ?? WarmWindow.ALWAYS;

    if (dto.invalidationIntervalSeconds !== undefined) {
      entry.invalidationIntervalSeconds = dto.invalidationIntervalSeconds;
      entry.nextInvalidationAt = new Date(
        Date.now() + dto.invalidationIntervalSeconds * 1000,
      );
    }

    entry.popularityScore = this.calculatePopularityScore(entry);

    return this.preloadDataRepository.save(entry);
  }

  async recordAccess(dto: RecordAccessDto): Promise<PreloadData> {
    let entry = await this.preloadDataRepository.findOne({
      where: { cacheKey: dto.cacheKey },
    });

    if (!entry) {
      entry = this.preloadDataRepository.create({
        cacheKey: dto.cacheKey,
        sourceType: dto.sourceType ?? PreloadSourceType.CUSTOM,
        payload: null,
        fetchUrl: null,
        tags: dto.tags ?? [],
        accessCount: 0,
        hitCount: 0,
        missCount: 0,
        popularityScore: 0,
        priority: 0,
        ttlSeconds: dto.ttlSeconds ?? 3600,
        isActive: true,
        warmWindow: WarmWindow.ALWAYS,
        lastAccessedAt: null,
        lastWarmedAt: null,
        expiresAt: null,
        invalidationIntervalSeconds: null,
        nextInvalidationAt: null,
      });
    }

    entry.accessCount += 1;
    entry.lastAccessedAt = new Date();
    entry.tags = dto.tags ?? entry.tags ?? [];
    entry.ttlSeconds = dto.ttlSeconds ?? entry.ttlSeconds ?? 3600;

    if (dto.hit) {
      entry.hitCount += 1;
      await this.redisCache.increment('cache-warming:hits');
    } else {
      entry.missCount += 1;
      entry.priority = Math.min(entry.priority + 1, 100);
      await this.redisCache.increment('cache-warming:misses');
    }

    entry.popularityScore = this.calculatePopularityScore(entry);

    await this.recordMetric(MetricName.CACHE_HIT_RATE, dto.hit ? 1 : 0, {
      cacheKey: dto.cacheKey,
      unit: 'event',
      tags: { hit: dto.hit },
    });

    return this.preloadDataRepository.save(entry);
  }

  async runWarmingJob(options: WarmingJobOptions): Promise<WarmingResult> {
    const job = await this.cacheJobRepository.save(
      this.cacheJobRepository.create({
        name: options.name,
        type: options.type ?? CacheJobType.WARM,
        status: CacheJobStatus.PENDING,
        priority: options.priority ?? 0,
        scheduledFor: new Date(),
        startedAt: null,
        finishedAt: null,
        targetKeys: options.keys ?? [],
        targetPattern: null,
        metadata: {
          limit: options.limit,
          adaptive: options.adaptive ?? false,
          ...(options.metadata ?? {}),
        },
        warmedKeys: 0,
        skippedKeys: 0,
        invalidatedKeys: 0,
        durationMs: null,
        errorMessage: null,
      }),
    );

    return this.executeWarmingJob(job, options);
  }

  async scheduleInvalidation(dto: ScheduleInvalidationDto): Promise<CacheJob> {
    const delaySeconds = dto.delaySeconds ?? 0;
    const targetKeys = this.normalizeKeys(dto.key, dto.keys);
    const scheduledFor = new Date(Date.now() + delaySeconds * 1000);
    const job = this.cacheJobRepository.create({
      name: 'scheduled-cache-invalidation',
      type: CacheJobType.INVALIDATE,
      status: CacheJobStatus.PENDING,
      priority: 50,
      scheduledFor,
      startedAt: null,
      finishedAt: null,
      targetKeys,
      targetPattern: dto.pattern ?? null,
      metadata: {
        repeatIntervalSeconds: dto.repeatIntervalSeconds,
      },
      warmedKeys: 0,
      skippedKeys: 0,
      invalidatedKeys: 0,
      durationMs: null,
      errorMessage: null,
    });

    if (targetKeys.length > 0 && dto.repeatIntervalSeconds) {
      await this.preloadDataRepository.update(
        { cacheKey: In(targetKeys) },
        {
          invalidationIntervalSeconds: dto.repeatIntervalSeconds,
          nextInvalidationAt: scheduledFor,
        },
      );
    }

    return this.cacheJobRepository.save(job);
  }

  async invalidateNow(request: InvalidationRequest): Promise<number> {
    const keys = this.normalizeKeys(request.key, request.keys);
    let invalidated = 0;

    if (keys.length > 0) {
      invalidated += await this.redisCache.deleteKeys(keys);
      await this.preloadDataRepository.update(
        { cacheKey: In(keys) },
        {
          expiresAt: null,
          lastWarmedAt: null,
        },
      );
    }

    if (request.pattern) {
      invalidated += await this.redisCache.deletePattern(request.pattern);
    }

    await this.recordMetric(MetricName.INVALIDATION_RUN, invalidated, {
      unit: 'keys',
      tags: {
        keys: keys.length,
        pattern: request.pattern ?? null,
      },
    });

    return invalidated;
  }

  async processDueJobs(): Promise<CacheJob[]> {
    const jobs = await this.cacheJobRepository.find({
      where: {
        status: CacheJobStatus.PENDING,
        scheduledFor: LessThanOrEqual(new Date()),
      },
      order: {
        priority: 'DESC',
        scheduledFor: 'ASC',
      },
      take: 25,
    });

    for (const job of jobs) {
      if (job.type === CacheJobType.INVALIDATE) {
        await this.executeInvalidationJob(job);
      } else if (job.type === CacheJobType.OPTIMIZE) {
        await this.executeOptimizationJob(job);
      } else {
        await this.executeWarmingJob(job, {
          name: job.name,
          type: job.type,
          keys: job.targetKeys,
          limit: this.getMetadataNumber(job.metadata, 'limit'),
          adaptive: Boolean(job.metadata.adaptive),
        });
      }
    }

    return jobs;
  }

  async invalidateDuePreloadData(): Promise<number> {
    const dueEntries = await this.preloadDataRepository.find({
      where: {
        isActive: true,
        nextInvalidationAt: LessThanOrEqual(new Date()),
      },
      take: 100,
    });

    let invalidated = 0;

    for (const entry of dueEntries) {
      invalidated += await this.invalidateNow({ key: entry.cacheKey });

      if (entry.invalidationIntervalSeconds) {
        entry.nextInvalidationAt = new Date(
          Date.now() + entry.invalidationIntervalSeconds * 1000,
        );
      } else {
        entry.nextInvalidationAt = null;
      }

      await this.preloadDataRepository.save(entry);
    }

    return invalidated;
  }

  async optimizeHitRate(): Promise<RedisCacheStats> {
    const stats = await this.redisCache.getStats();
    const target = Number(
      this.configService.get<string>('CACHE_HIT_RATE_TARGET') || '0.85',
    );

    await this.recordMetric(MetricName.CACHE_HIT_RATE, stats.hitRate, {
      unit: 'ratio',
      tags: {
        hits: stats.hits,
        misses: stats.misses,
        target,
      },
    });

    if (stats.hitRate > 0 && stats.hitRate < target) {
      const missHeavyEntries = await this.preloadDataRepository.find({
        where: { isActive: true },
        order: {
          missCount: 'DESC',
          popularityScore: 'DESC',
        },
        take: 25,
      });

      for (const entry of missHeavyEntries) {
        entry.priority = Math.min(entry.priority + 5, 100);
        entry.popularityScore = this.calculatePopularityScore(entry);
      }

      await this.preloadDataRepository.save(missHeavyEntries);
      await this.runWarmingJob({
        name: 'hit-rate-optimization',
        type: CacheJobType.OPTIMIZE,
        limit: this.getDefaultWarmLimit(),
        metadata: {
          observedHitRate: stats.hitRate,
          targetHitRate: target,
        },
      });
    }

    await this.recordMetric(MetricName.OPTIMIZATION, stats.hitRate, {
      unit: 'ratio',
      tags: { target },
    });

    return stats;
  }

  async getDashboard() {
    const [redisStats, topCandidates, recentJobs, recentMetrics] =
      await Promise.all([
        this.redisCache.getStats(),
        this.getTopCandidates(10),
        this.listJobs(10),
        this.listMetrics(20),
      ]);

    return {
      currentWarmWindow: this.getCurrentWarmWindow(),
      redisStats,
      topCandidates,
      recentJobs,
      recentMetrics,
    };
  }

  async getTopCandidates(limit = 25): Promise<PreloadData[]> {
    return this.selectCandidates(limit, true);
  }

  async listPreloadData(limit = 100): Promise<PreloadData[]> {
    return this.preloadDataRepository.find({
      order: {
        popularityScore: 'DESC',
        priority: 'DESC',
      },
      take: limit,
    });
  }

  async listJobs(limit = 50): Promise<CacheJob[]> {
    return this.cacheJobRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async listMetrics(limit = 100): Promise<Metric[]> {
    return this.metricRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  getCurrentWarmWindow(date = new Date()): WarmWindow {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) {
      return WarmWindow.MORNING;
    }

    if (hour >= 12 && hour < 17) {
      return WarmWindow.AFTERNOON;
    }

    if (hour >= 17 && hour < 22) {
      return WarmWindow.EVENING;
    }

    return WarmWindow.NIGHT;
  }

  calculatePopularityScore(entry: PreloadData): number {
    const totalAccesses = entry.accessCount || 0;
    const hitRate = totalAccesses > 0 ? entry.hitCount / totalAccesses : 0;
    const missPressure = (entry.missCount || 0) * 1.4;
    const priorityBoost = (entry.priority || 0) * 2;
    const recencyBoost = this.calculateRecencyBoost(entry.lastAccessedAt);
    const rawScore =
      totalAccesses +
      missPressure +
      hitRate * 20 +
      priorityBoost +
      recencyBoost;

    return Math.round(rawScore * 100) / 100;
  }

  private async executeWarmingJob(
    job: CacheJob,
    options: WarmingJobOptions,
  ): Promise<WarmingResult> {
    job.status = CacheJobStatus.RUNNING;
    job.startedAt = new Date();
    job.errorMessage = null;
    await this.cacheJobRepository.save(job);

    try {
      const candidates =
        options.keys && options.keys.length > 0
          ? await this.ensurePreloadEntries(options.keys)
          : await this.selectCandidates(
              options.limit ?? this.getDefaultWarmLimit(),
              Boolean(options.adaptive),
            );

      let warmedKeys = 0;
      let skippedKeys = 0;

      for (const candidate of candidates) {
        if (options.adaptive && !this.isEligibleForCurrentWindow(candidate)) {
          skippedKeys += 1;
          continue;
        }

        const shouldRefresh = await this.shouldRefresh(candidate);

        if (!shouldRefresh) {
          skippedKeys += 1;
          continue;
        }

        const start = Date.now();
        const payload = await this.resolvePayload(candidate);
        await this.redisCache.setJson(
          candidate.cacheKey,
          payload,
          candidate.ttlSeconds,
        );

        candidate.lastWarmedAt = new Date();
        candidate.expiresAt = new Date(
          Date.now() + candidate.ttlSeconds * 1000,
        );
        candidate.popularityScore = this.calculatePopularityScore(candidate);
        await this.preloadDataRepository.save(candidate);

        warmedKeys += 1;
        await this.recordMetric(
          MetricName.PRELOAD_LATENCY,
          Date.now() - start,
          {
            cacheKey: candidate.cacheKey,
            unit: 'ms',
            tags: {
              sourceType: candidate.sourceType,
              warmWindow: candidate.warmWindow,
            },
          },
        );
      }

      job.status = CacheJobStatus.SUCCEEDED;
      job.warmedKeys = warmedKeys;
      job.skippedKeys = skippedKeys;
      job.finishedAt = new Date();
      job.durationMs = job.startedAt
        ? Date.now() - job.startedAt.getTime()
        : null;
      await this.cacheJobRepository.save(job);

      await this.recordMetric(MetricName.WARMING_RUN, warmedKeys, {
        unit: 'keys',
        tags: {
          skippedKeys,
          type: job.type,
          adaptive: Boolean(options.adaptive),
        },
      });

      this.logger.log(
        `Warming job ${job.name} completed: warmed=${warmedKeys}, skipped=${skippedKeys}`,
      );

      return this.toWarmingResult(job);
    } catch (error) {
      job.status = CacheJobStatus.FAILED;
      job.finishedAt = new Date();
      job.durationMs = job.startedAt
        ? Date.now() - job.startedAt.getTime()
        : null;
      job.errorMessage = error instanceof Error ? error.message : String(error);
      await this.cacheJobRepository.save(job);
      await this.recordMetric(MetricName.ERROR, 1, {
        unit: 'count',
        tags: {
          jobId: job.id,
          jobName: job.name,
          error: job.errorMessage,
        },
      });
      throw error;
    }
  }

  private async executeInvalidationJob(job: CacheJob): Promise<WarmingResult> {
    job.status = CacheJobStatus.RUNNING;
    job.startedAt = new Date();
    await this.cacheJobRepository.save(job);

    try {
      const invalidatedKeys = await this.invalidateNow({
        keys: job.targetKeys,
        pattern: job.targetPattern ?? undefined,
      });

      job.status = CacheJobStatus.SUCCEEDED;
      job.invalidatedKeys = invalidatedKeys;
      job.finishedAt = new Date();
      job.durationMs = job.startedAt
        ? Date.now() - job.startedAt.getTime()
        : null;
      await this.cacheJobRepository.save(job);

      const repeatIntervalSeconds = this.getMetadataNumber(
        job.metadata,
        'repeatIntervalSeconds',
      );

      if (repeatIntervalSeconds) {
        await this.cacheJobRepository.save(
          this.cacheJobRepository.create({
            ...job,
            id: undefined,
            status: CacheJobStatus.PENDING,
            scheduledFor: new Date(Date.now() + repeatIntervalSeconds * 1000),
            startedAt: null,
            finishedAt: null,
            durationMs: null,
            errorMessage: null,
            invalidatedKeys: 0,
          }),
        );
      }

      return this.toWarmingResult(job);
    } catch (error) {
      job.status = CacheJobStatus.FAILED;
      job.finishedAt = new Date();
      job.durationMs = job.startedAt
        ? Date.now() - job.startedAt.getTime()
        : null;
      job.errorMessage = error instanceof Error ? error.message : String(error);
      await this.cacheJobRepository.save(job);
      throw error;
    }
  }

  private async executeOptimizationJob(job: CacheJob): Promise<WarmingResult> {
    const before = Date.now();
    job.status = CacheJobStatus.RUNNING;
    job.startedAt = new Date();
    await this.cacheJobRepository.save(job);

    const stats = await this.optimizeHitRate();
    job.status = CacheJobStatus.SUCCEEDED;
    job.finishedAt = new Date();
    job.durationMs = Date.now() - before;
    job.metadata = {
      ...(job.metadata ?? {}),
      observedHitRate: stats.hitRate,
    };
    await this.cacheJobRepository.save(job);

    return this.toWarmingResult(job);
  }

  private async selectCandidates(
    limit: number,
    adaptive: boolean,
  ): Promise<PreloadData[]> {
    const sampleSize = Math.max(limit * 5, limit, 25);
    const entries = await this.preloadDataRepository.find({
      where: { isActive: true },
      order: {
        priority: 'DESC',
        popularityScore: 'DESC',
        lastAccessedAt: 'DESC',
      },
      take: sampleSize,
    });

    return entries
      .sort((left, right) => {
        const leftScore = this.calculateAdaptiveScore(left, adaptive);
        const rightScore = this.calculateAdaptiveScore(right, adaptive);
        return rightScore - leftScore;
      })
      .slice(0, limit);
  }

  private async ensurePreloadEntries(keys: string[]): Promise<PreloadData[]> {
    const existing = await this.preloadDataRepository.find({
      where: { cacheKey: In(keys) },
    });
    const existingKeys = new Set(existing.map((entry) => entry.cacheKey));
    const missing = keys.filter((key) => !existingKeys.has(key));

    for (const key of missing) {
      existing.push(
        await this.upsertPreloadData({
          cacheKey: key,
          sourceType: PreloadSourceType.CUSTOM,
          priority: 75,
          ttlSeconds: 3600,
          tags: ['manual'],
        }),
      );
    }

    return existing;
  }

  private async shouldRefresh(entry: PreloadData): Promise<boolean> {
    const ttl = await this.redisCache.ttl(entry.cacheKey);

    if (ttl === -2) {
      return true;
    }

    if (ttl === -1) {
      return false;
    }

    const refreshThreshold = Math.max(60, Math.floor(entry.ttlSeconds * 0.25));
    return ttl <= refreshThreshold;
  }

  private async resolvePayload(entry: PreloadData): Promise<unknown> {
    if (entry.fetchUrl) {
      return this.fetchPayload(entry);
    }

    if (entry.payload) {
      return entry.payload;
    }

    return {
      cacheKey: entry.cacheKey,
      sourceType: entry.sourceType,
      tags: entry.tags,
      warmedAt: new Date().toISOString(),
      generatedBy: 'cache-warming-service',
    };
  }

  private async fetchPayload(entry: PreloadData): Promise<unknown> {
    const timeoutMs = Number(
      this.configService.get<string>('PRELOAD_FETCH_TIMEOUT_MS') || '2500',
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(entry.fetchUrl as string, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Fetch failed for ${entry.cacheKey}: ${response.status}`,
        );
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        return response.json();
      }

      return {
        body: await response.text(),
        fetchedAt: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private calculateAdaptiveScore(
    entry: PreloadData,
    adaptive: boolean,
  ): number {
    const baseScore = this.calculatePopularityScore(entry);

    if (!adaptive) {
      return baseScore;
    }

    if (entry.warmWindow === WarmWindow.ALWAYS) {
      return baseScore + 10;
    }

    return this.isEligibleForCurrentWindow(entry)
      ? baseScore + 40
      : baseScore - 20;
  }

  private isEligibleForCurrentWindow(entry: PreloadData): boolean {
    return (
      entry.warmWindow === WarmWindow.ALWAYS ||
      entry.warmWindow === this.getCurrentWarmWindow()
    );
  }

  private calculateRecencyBoost(lastAccessedAt: Date | null): number {
    if (!lastAccessedAt) {
      return 0;
    }

    const hoursSinceAccess = (Date.now() - lastAccessedAt.getTime()) / 36e5;
    return Math.max(0, 24 - hoursSinceAccess);
  }

  private async recordMetric(
    name: MetricName,
    value: number,
    options: {
      cacheKey?: string;
      unit?: string;
      tags?: Record<string, unknown>;
      windowStart?: Date;
      windowEnd?: Date;
    } = {},
  ): Promise<Metric> {
    return this.metricRepository.save(
      this.metricRepository.create({
        name,
        cacheKey: options.cacheKey ?? null,
        value,
        unit: options.unit ?? 'count',
        tags: options.tags ?? {},
        windowStart: options.windowStart ?? null,
        windowEnd: options.windowEnd ?? null,
      }),
    );
  }

  private getDefaultWarmLimit(): number {
    return Number(
      this.configService.get<string>('CACHE_WARMING_LIMIT') || '50',
    );
  }

  private getMetadataNumber(
    metadata: Record<string, unknown>,
    key: string,
  ): number | undefined {
    const value = metadata[key];

    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private normalizeKeys(key?: string, keys?: string[]): string[] {
    return Array.from(new Set([...(keys ?? []), ...(key ? [key] : [])]));
  }

  private toWarmingResult(job: CacheJob): WarmingResult {
    return {
      jobId: job.id,
      status: job.status,
      warmedKeys: job.warmedKeys,
      skippedKeys: job.skippedKeys,
      invalidatedKeys: job.invalidatedKeys,
      durationMs: job.durationMs,
    };
  }

  private async seedDefaultPreloadData(): Promise<void> {
    const shouldSeed =
      this.configService.get<string>('CACHE_WARMING_SEED_DEFAULTS', 'true') !==
      'false';

    if (!shouldSeed) {
      return;
    }

    const count = await this.preloadDataRepository.count();

    if (count > 0) {
      return;
    }

    const defaults: CreatePreloadDataDto[] = [
      {
        cacheKey: 'quest:puzzles:featured',
        sourceType: PreloadSourceType.PUZZLE,
        payload: { list: [], description: 'Featured Quest puzzles' },
        tags: ['puzzles', 'featured'],
        priority: 95,
        ttlSeconds: 1800,
        warmWindow: WarmWindow.ALWAYS,
      },
      {
        cacheKey: 'quest:puzzles:daily-challenge',
        sourceType: PreloadSourceType.PUZZLE,
        payload: { active: true, description: 'Daily logic challenge' },
        tags: ['puzzles', 'daily'],
        priority: 90,
        ttlSeconds: 900,
        warmWindow: WarmWindow.MORNING,
      },
      {
        cacheKey: 'quest:leaderboards:daily',
        sourceType: PreloadSourceType.LEADERBOARD,
        payload: { entries: [], period: 'daily' },
        tags: ['leaderboard'],
        priority: 85,
        ttlSeconds: 600,
        warmWindow: WarmWindow.EVENING,
      },
      {
        cacheKey: 'quest:achievements:catalog',
        sourceType: PreloadSourceType.ACHIEVEMENT,
        payload: { achievements: [], chain: 'stellar' },
        tags: ['achievements', 'stellar'],
        priority: 80,
        ttlSeconds: 3600,
        warmWindow: WarmWindow.ALWAYS,
      },
      {
        cacheKey: 'quest:config:gameplay',
        sourceType: PreloadSourceType.CONFIG,
        payload: { hintsEnabled: true, rewardsEnabled: true },
        tags: ['config'],
        priority: 75,
        ttlSeconds: 3600,
        warmWindow: WarmWindow.ALWAYS,
      },
      {
        cacheKey: 'quest:blockchain:stellar-network',
        sourceType: PreloadSourceType.BLOCKCHAIN,
        payload: { network: 'testnet', rewards: 'soroban-nft' },
        tags: ['stellar', 'soroban'],
        priority: 70,
        ttlSeconds: 3600,
        warmWindow: WarmWindow.ALWAYS,
      },
    ];

    for (const entry of defaults) {
      await this.upsertPreloadData(entry);
    }

    this.logger.log(`Seeded ${defaults.length} default preload candidates`);
  }
}
