import { OnApplicationBootstrap, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CreatePreloadDataDto } from './dto/create-preload-data.dto';
import { RecordAccessDto } from './dto/record-access.dto';
import { ScheduleInvalidationDto } from './dto/schedule-invalidation.dto';
import { CacheJob, CacheJobStatus, CacheJobType } from './entities/cache-job.entity';
import { Metric } from './entities/metric.entity';
import { PreloadData, WarmWindow } from './entities/preload-data.entity';
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
export declare class CacheWarmingService implements OnModuleInit, OnApplicationBootstrap {
    private readonly cacheJobRepository;
    private readonly preloadDataRepository;
    private readonly metricRepository;
    private readonly redisCache;
    private readonly configService;
    private readonly logger;
    constructor(cacheJobRepository: Repository<CacheJob>, preloadDataRepository: Repository<PreloadData>, metricRepository: Repository<Metric>, redisCache: RedisCacheService, configService: ConfigService);
    onModuleInit(): Promise<void>;
    onApplicationBootstrap(): Promise<void>;
    upsertPreloadData(dto: CreatePreloadDataDto): Promise<PreloadData>;
    recordAccess(dto: RecordAccessDto): Promise<PreloadData>;
    runWarmingJob(options: WarmingJobOptions): Promise<WarmingResult>;
    scheduleInvalidation(dto: ScheduleInvalidationDto): Promise<CacheJob>;
    invalidateNow(request: InvalidationRequest): Promise<number>;
    processDueJobs(): Promise<CacheJob[]>;
    invalidateDuePreloadData(): Promise<number>;
    optimizeHitRate(): Promise<RedisCacheStats>;
    getDashboard(): Promise<{
        currentWarmWindow: WarmWindow;
        redisStats: RedisCacheStats;
        topCandidates: PreloadData[];
        recentJobs: CacheJob[];
        recentMetrics: Metric[];
    }>;
    getTopCandidates(limit?: number): Promise<PreloadData[]>;
    listPreloadData(limit?: number): Promise<PreloadData[]>;
    listJobs(limit?: number): Promise<CacheJob[]>;
    listMetrics(limit?: number): Promise<Metric[]>;
    getCurrentWarmWindow(date?: Date): WarmWindow;
    calculatePopularityScore(entry: PreloadData): number;
    private executeWarmingJob;
    private executeInvalidationJob;
    private executeOptimizationJob;
    private selectCandidates;
    private ensurePreloadEntries;
    private shouldRefresh;
    private resolvePayload;
    private fetchPayload;
    private calculateAdaptiveScore;
    private isEligibleForCurrentWindow;
    private calculateRecencyBoost;
    private recordMetric;
    private getDefaultWarmLimit;
    private getMetadataNumber;
    private normalizeKeys;
    private toWarmingResult;
    private seedDefaultPreloadData;
}
export {};
