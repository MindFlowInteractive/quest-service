"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheWarmingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheWarmingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cache_job_entity_1 = require("./entities/cache-job.entity");
const metric_entity_1 = require("./entities/metric.entity");
const preload_data_entity_1 = require("./entities/preload-data.entity");
const redis_cache_service_1 = require("./redis-cache.service");
let CacheWarmingService = CacheWarmingService_1 = class CacheWarmingService {
    constructor(cacheJobRepository, preloadDataRepository, metricRepository, redisCache, configService) {
        this.cacheJobRepository = cacheJobRepository;
        this.preloadDataRepository = preloadDataRepository;
        this.metricRepository = metricRepository;
        this.redisCache = redisCache;
        this.configService = configService;
        this.logger = new common_1.Logger(CacheWarmingService_1.name);
    }
    async onModuleInit() {
        await this.seedDefaultPreloadData();
    }
    async onApplicationBootstrap() {
        const warmOnStartup = this.configService.get('CACHE_WARM_ON_STARTUP', 'true') !==
            'false';
        if (!warmOnStartup) {
            return;
        }
        try {
            await this.runWarmingJob({
                name: 'startup-popular-cache-warming',
                type: cache_job_entity_1.CacheJobType.WARM,
                limit: this.getDefaultWarmLimit(),
                priority: 100,
            });
        }
        catch (error) {
            this.logger.warn(`Startup cache warming skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async upsertPreloadData(dto) {
        const existing = await this.preloadDataRepository.findOne({
            where: { cacheKey: dto.cacheKey },
        });
        const entry = existing ??
            this.preloadDataRepository.create({
                cacheKey: dto.cacheKey,
                sourceType: dto.sourceType ?? preload_data_entity_1.PreloadSourceType.CUSTOM,
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
                warmWindow: dto.warmWindow ?? preload_data_entity_1.WarmWindow.ALWAYS,
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
        entry.warmWindow = dto.warmWindow ?? entry.warmWindow ?? preload_data_entity_1.WarmWindow.ALWAYS;
        if (dto.invalidationIntervalSeconds !== undefined) {
            entry.invalidationIntervalSeconds = dto.invalidationIntervalSeconds;
            entry.nextInvalidationAt = new Date(Date.now() + dto.invalidationIntervalSeconds * 1000);
        }
        entry.popularityScore = this.calculatePopularityScore(entry);
        return this.preloadDataRepository.save(entry);
    }
    async recordAccess(dto) {
        let entry = await this.preloadDataRepository.findOne({
            where: { cacheKey: dto.cacheKey },
        });
        if (!entry) {
            entry = this.preloadDataRepository.create({
                cacheKey: dto.cacheKey,
                sourceType: dto.sourceType ?? preload_data_entity_1.PreloadSourceType.CUSTOM,
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
                warmWindow: preload_data_entity_1.WarmWindow.ALWAYS,
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
        }
        else {
            entry.missCount += 1;
            entry.priority = Math.min(entry.priority + 1, 100);
            await this.redisCache.increment('cache-warming:misses');
        }
        entry.popularityScore = this.calculatePopularityScore(entry);
        await this.recordMetric(metric_entity_1.MetricName.CACHE_HIT_RATE, dto.hit ? 1 : 0, {
            cacheKey: dto.cacheKey,
            unit: 'event',
            tags: { hit: dto.hit },
        });
        return this.preloadDataRepository.save(entry);
    }
    async runWarmingJob(options) {
        const job = await this.cacheJobRepository.save(this.cacheJobRepository.create({
            name: options.name,
            type: options.type ?? cache_job_entity_1.CacheJobType.WARM,
            status: cache_job_entity_1.CacheJobStatus.PENDING,
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
        }));
        return this.executeWarmingJob(job, options);
    }
    async scheduleInvalidation(dto) {
        const delaySeconds = dto.delaySeconds ?? 0;
        const targetKeys = this.normalizeKeys(dto.key, dto.keys);
        const scheduledFor = new Date(Date.now() + delaySeconds * 1000);
        const job = this.cacheJobRepository.create({
            name: 'scheduled-cache-invalidation',
            type: cache_job_entity_1.CacheJobType.INVALIDATE,
            status: cache_job_entity_1.CacheJobStatus.PENDING,
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
            await this.preloadDataRepository.update({ cacheKey: (0, typeorm_2.In)(targetKeys) }, {
                invalidationIntervalSeconds: dto.repeatIntervalSeconds,
                nextInvalidationAt: scheduledFor,
            });
        }
        return this.cacheJobRepository.save(job);
    }
    async invalidateNow(request) {
        const keys = this.normalizeKeys(request.key, request.keys);
        let invalidated = 0;
        if (keys.length > 0) {
            invalidated += await this.redisCache.deleteKeys(keys);
            await this.preloadDataRepository.update({ cacheKey: (0, typeorm_2.In)(keys) }, {
                expiresAt: null,
                lastWarmedAt: null,
            });
        }
        if (request.pattern) {
            invalidated += await this.redisCache.deletePattern(request.pattern);
        }
        await this.recordMetric(metric_entity_1.MetricName.INVALIDATION_RUN, invalidated, {
            unit: 'keys',
            tags: {
                keys: keys.length,
                pattern: request.pattern ?? null,
            },
        });
        return invalidated;
    }
    async processDueJobs() {
        const jobs = await this.cacheJobRepository.find({
            where: {
                status: cache_job_entity_1.CacheJobStatus.PENDING,
                scheduledFor: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
            order: {
                priority: 'DESC',
                scheduledFor: 'ASC',
            },
            take: 25,
        });
        for (const job of jobs) {
            if (job.type === cache_job_entity_1.CacheJobType.INVALIDATE) {
                await this.executeInvalidationJob(job);
            }
            else if (job.type === cache_job_entity_1.CacheJobType.OPTIMIZE) {
                await this.executeOptimizationJob(job);
            }
            else {
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
    async invalidateDuePreloadData() {
        const dueEntries = await this.preloadDataRepository.find({
            where: {
                isActive: true,
                nextInvalidationAt: (0, typeorm_2.LessThanOrEqual)(new Date()),
            },
            take: 100,
        });
        let invalidated = 0;
        for (const entry of dueEntries) {
            invalidated += await this.invalidateNow({ key: entry.cacheKey });
            if (entry.invalidationIntervalSeconds) {
                entry.nextInvalidationAt = new Date(Date.now() + entry.invalidationIntervalSeconds * 1000);
            }
            else {
                entry.nextInvalidationAt = null;
            }
            await this.preloadDataRepository.save(entry);
        }
        return invalidated;
    }
    async optimizeHitRate() {
        const stats = await this.redisCache.getStats();
        const target = Number(this.configService.get('CACHE_HIT_RATE_TARGET') || '0.85');
        await this.recordMetric(metric_entity_1.MetricName.CACHE_HIT_RATE, stats.hitRate, {
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
                type: cache_job_entity_1.CacheJobType.OPTIMIZE,
                limit: this.getDefaultWarmLimit(),
                metadata: {
                    observedHitRate: stats.hitRate,
                    targetHitRate: target,
                },
            });
        }
        await this.recordMetric(metric_entity_1.MetricName.OPTIMIZATION, stats.hitRate, {
            unit: 'ratio',
            tags: { target },
        });
        return stats;
    }
    async getDashboard() {
        const [redisStats, topCandidates, recentJobs, recentMetrics] = await Promise.all([
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
    async getTopCandidates(limit = 25) {
        return this.selectCandidates(limit, true);
    }
    async listPreloadData(limit = 100) {
        return this.preloadDataRepository.find({
            order: {
                popularityScore: 'DESC',
                priority: 'DESC',
            },
            take: limit,
        });
    }
    async listJobs(limit = 50) {
        return this.cacheJobRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async listMetrics(limit = 100) {
        return this.metricRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    getCurrentWarmWindow(date = new Date()) {
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) {
            return preload_data_entity_1.WarmWindow.MORNING;
        }
        if (hour >= 12 && hour < 17) {
            return preload_data_entity_1.WarmWindow.AFTERNOON;
        }
        if (hour >= 17 && hour < 22) {
            return preload_data_entity_1.WarmWindow.EVENING;
        }
        return preload_data_entity_1.WarmWindow.NIGHT;
    }
    calculatePopularityScore(entry) {
        const totalAccesses = entry.accessCount || 0;
        const hitRate = totalAccesses > 0 ? entry.hitCount / totalAccesses : 0;
        const missPressure = (entry.missCount || 0) * 1.4;
        const priorityBoost = (entry.priority || 0) * 2;
        const recencyBoost = this.calculateRecencyBoost(entry.lastAccessedAt);
        const rawScore = totalAccesses +
            missPressure +
            hitRate * 20 +
            priorityBoost +
            recencyBoost;
        return Math.round(rawScore * 100) / 100;
    }
    async executeWarmingJob(job, options) {
        job.status = cache_job_entity_1.CacheJobStatus.RUNNING;
        job.startedAt = new Date();
        job.errorMessage = null;
        await this.cacheJobRepository.save(job);
        try {
            const candidates = options.keys && options.keys.length > 0
                ? await this.ensurePreloadEntries(options.keys)
                : await this.selectCandidates(options.limit ?? this.getDefaultWarmLimit(), Boolean(options.adaptive));
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
                await this.redisCache.setJson(candidate.cacheKey, payload, candidate.ttlSeconds);
                candidate.lastWarmedAt = new Date();
                candidate.expiresAt = new Date(Date.now() + candidate.ttlSeconds * 1000);
                candidate.popularityScore = this.calculatePopularityScore(candidate);
                await this.preloadDataRepository.save(candidate);
                warmedKeys += 1;
                await this.recordMetric(metric_entity_1.MetricName.PRELOAD_LATENCY, Date.now() - start, {
                    cacheKey: candidate.cacheKey,
                    unit: 'ms',
                    tags: {
                        sourceType: candidate.sourceType,
                        warmWindow: candidate.warmWindow,
                    },
                });
            }
            job.status = cache_job_entity_1.CacheJobStatus.SUCCEEDED;
            job.warmedKeys = warmedKeys;
            job.skippedKeys = skippedKeys;
            job.finishedAt = new Date();
            job.durationMs = job.startedAt
                ? Date.now() - job.startedAt.getTime()
                : null;
            await this.cacheJobRepository.save(job);
            await this.recordMetric(metric_entity_1.MetricName.WARMING_RUN, warmedKeys, {
                unit: 'keys',
                tags: {
                    skippedKeys,
                    type: job.type,
                    adaptive: Boolean(options.adaptive),
                },
            });
            this.logger.log(`Warming job ${job.name} completed: warmed=${warmedKeys}, skipped=${skippedKeys}`);
            return this.toWarmingResult(job);
        }
        catch (error) {
            job.status = cache_job_entity_1.CacheJobStatus.FAILED;
            job.finishedAt = new Date();
            job.durationMs = job.startedAt
                ? Date.now() - job.startedAt.getTime()
                : null;
            job.errorMessage = error instanceof Error ? error.message : String(error);
            await this.cacheJobRepository.save(job);
            await this.recordMetric(metric_entity_1.MetricName.ERROR, 1, {
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
    async executeInvalidationJob(job) {
        job.status = cache_job_entity_1.CacheJobStatus.RUNNING;
        job.startedAt = new Date();
        await this.cacheJobRepository.save(job);
        try {
            const invalidatedKeys = await this.invalidateNow({
                keys: job.targetKeys,
                pattern: job.targetPattern ?? undefined,
            });
            job.status = cache_job_entity_1.CacheJobStatus.SUCCEEDED;
            job.invalidatedKeys = invalidatedKeys;
            job.finishedAt = new Date();
            job.durationMs = job.startedAt
                ? Date.now() - job.startedAt.getTime()
                : null;
            await this.cacheJobRepository.save(job);
            const repeatIntervalSeconds = this.getMetadataNumber(job.metadata, 'repeatIntervalSeconds');
            if (repeatIntervalSeconds) {
                await this.cacheJobRepository.save(this.cacheJobRepository.create({
                    ...job,
                    id: undefined,
                    status: cache_job_entity_1.CacheJobStatus.PENDING,
                    scheduledFor: new Date(Date.now() + repeatIntervalSeconds * 1000),
                    startedAt: null,
                    finishedAt: null,
                    durationMs: null,
                    errorMessage: null,
                    invalidatedKeys: 0,
                }));
            }
            return this.toWarmingResult(job);
        }
        catch (error) {
            job.status = cache_job_entity_1.CacheJobStatus.FAILED;
            job.finishedAt = new Date();
            job.durationMs = job.startedAt
                ? Date.now() - job.startedAt.getTime()
                : null;
            job.errorMessage = error instanceof Error ? error.message : String(error);
            await this.cacheJobRepository.save(job);
            throw error;
        }
    }
    async executeOptimizationJob(job) {
        const before = Date.now();
        job.status = cache_job_entity_1.CacheJobStatus.RUNNING;
        job.startedAt = new Date();
        await this.cacheJobRepository.save(job);
        const stats = await this.optimizeHitRate();
        job.status = cache_job_entity_1.CacheJobStatus.SUCCEEDED;
        job.finishedAt = new Date();
        job.durationMs = Date.now() - before;
        job.metadata = {
            ...(job.metadata ?? {}),
            observedHitRate: stats.hitRate,
        };
        await this.cacheJobRepository.save(job);
        return this.toWarmingResult(job);
    }
    async selectCandidates(limit, adaptive) {
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
    async ensurePreloadEntries(keys) {
        const existing = await this.preloadDataRepository.find({
            where: { cacheKey: (0, typeorm_2.In)(keys) },
        });
        const existingKeys = new Set(existing.map((entry) => entry.cacheKey));
        const missing = keys.filter((key) => !existingKeys.has(key));
        for (const key of missing) {
            existing.push(await this.upsertPreloadData({
                cacheKey: key,
                sourceType: preload_data_entity_1.PreloadSourceType.CUSTOM,
                priority: 75,
                ttlSeconds: 3600,
                tags: ['manual'],
            }));
        }
        return existing;
    }
    async shouldRefresh(entry) {
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
    async resolvePayload(entry) {
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
    async fetchPayload(entry) {
        const timeoutMs = Number(this.configService.get('PRELOAD_FETCH_TIMEOUT_MS') || '2500');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(entry.fetchUrl, {
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Fetch failed for ${entry.cacheKey}: ${response.status}`);
            }
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return response.json();
            }
            return {
                body: await response.text(),
                fetchedAt: new Date().toISOString(),
            };
        }
        finally {
            clearTimeout(timeout);
        }
    }
    calculateAdaptiveScore(entry, adaptive) {
        const baseScore = this.calculatePopularityScore(entry);
        if (!adaptive) {
            return baseScore;
        }
        if (entry.warmWindow === preload_data_entity_1.WarmWindow.ALWAYS) {
            return baseScore + 10;
        }
        return this.isEligibleForCurrentWindow(entry)
            ? baseScore + 40
            : baseScore - 20;
    }
    isEligibleForCurrentWindow(entry) {
        return (entry.warmWindow === preload_data_entity_1.WarmWindow.ALWAYS ||
            entry.warmWindow === this.getCurrentWarmWindow());
    }
    calculateRecencyBoost(lastAccessedAt) {
        if (!lastAccessedAt) {
            return 0;
        }
        const hoursSinceAccess = (Date.now() - lastAccessedAt.getTime()) / 36e5;
        return Math.max(0, 24 - hoursSinceAccess);
    }
    async recordMetric(name, value, options = {}) {
        return this.metricRepository.save(this.metricRepository.create({
            name,
            cacheKey: options.cacheKey ?? null,
            value,
            unit: options.unit ?? 'count',
            tags: options.tags ?? {},
            windowStart: options.windowStart ?? null,
            windowEnd: options.windowEnd ?? null,
        }));
    }
    getDefaultWarmLimit() {
        return Number(this.configService.get('CACHE_WARMING_LIMIT') || '50');
    }
    getMetadataNumber(metadata, key) {
        const value = metadata[key];
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : undefined;
    }
    normalizeKeys(key, keys) {
        return Array.from(new Set([...(keys ?? []), ...(key ? [key] : [])]));
    }
    toWarmingResult(job) {
        return {
            jobId: job.id,
            status: job.status,
            warmedKeys: job.warmedKeys,
            skippedKeys: job.skippedKeys,
            invalidatedKeys: job.invalidatedKeys,
            durationMs: job.durationMs,
        };
    }
    async seedDefaultPreloadData() {
        const shouldSeed = this.configService.get('CACHE_WARMING_SEED_DEFAULTS', 'true') !==
            'false';
        if (!shouldSeed) {
            return;
        }
        const count = await this.preloadDataRepository.count();
        if (count > 0) {
            return;
        }
        const defaults = [
            {
                cacheKey: 'quest:puzzles:featured',
                sourceType: preload_data_entity_1.PreloadSourceType.PUZZLE,
                payload: { list: [], description: 'Featured Quest puzzles' },
                tags: ['puzzles', 'featured'],
                priority: 95,
                ttlSeconds: 1800,
                warmWindow: preload_data_entity_1.WarmWindow.ALWAYS,
            },
            {
                cacheKey: 'quest:puzzles:daily-challenge',
                sourceType: preload_data_entity_1.PreloadSourceType.PUZZLE,
                payload: { active: true, description: 'Daily logic challenge' },
                tags: ['puzzles', 'daily'],
                priority: 90,
                ttlSeconds: 900,
                warmWindow: preload_data_entity_1.WarmWindow.MORNING,
            },
            {
                cacheKey: 'quest:leaderboards:daily',
                sourceType: preload_data_entity_1.PreloadSourceType.LEADERBOARD,
                payload: { entries: [], period: 'daily' },
                tags: ['leaderboard'],
                priority: 85,
                ttlSeconds: 600,
                warmWindow: preload_data_entity_1.WarmWindow.EVENING,
            },
            {
                cacheKey: 'quest:achievements:catalog',
                sourceType: preload_data_entity_1.PreloadSourceType.ACHIEVEMENT,
                payload: { achievements: [], chain: 'stellar' },
                tags: ['achievements', 'stellar'],
                priority: 80,
                ttlSeconds: 3600,
                warmWindow: preload_data_entity_1.WarmWindow.ALWAYS,
            },
            {
                cacheKey: 'quest:config:gameplay',
                sourceType: preload_data_entity_1.PreloadSourceType.CONFIG,
                payload: { hintsEnabled: true, rewardsEnabled: true },
                tags: ['config'],
                priority: 75,
                ttlSeconds: 3600,
                warmWindow: preload_data_entity_1.WarmWindow.ALWAYS,
            },
            {
                cacheKey: 'quest:blockchain:stellar-network',
                sourceType: preload_data_entity_1.PreloadSourceType.BLOCKCHAIN,
                payload: { network: 'testnet', rewards: 'soroban-nft' },
                tags: ['stellar', 'soroban'],
                priority: 70,
                ttlSeconds: 3600,
                warmWindow: preload_data_entity_1.WarmWindow.ALWAYS,
            },
        ];
        for (const entry of defaults) {
            await this.upsertPreloadData(entry);
        }
        this.logger.log(`Seeded ${defaults.length} default preload candidates`);
    }
};
exports.CacheWarmingService = CacheWarmingService;
exports.CacheWarmingService = CacheWarmingService = CacheWarmingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cache_job_entity_1.CacheJob)),
    __param(1, (0, typeorm_1.InjectRepository)(preload_data_entity_1.PreloadData)),
    __param(2, (0, typeorm_1.InjectRepository)(metric_entity_1.Metric)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_cache_service_1.RedisCacheService,
        config_1.ConfigService])
], CacheWarmingService);
//# sourceMappingURL=cache-warming.service.js.map