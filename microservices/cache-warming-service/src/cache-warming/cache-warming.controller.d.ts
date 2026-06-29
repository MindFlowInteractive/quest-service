import { CacheWarmingService } from './cache-warming.service';
import { CreatePreloadDataDto } from './dto/create-preload-data.dto';
import { RecordAccessDto } from './dto/record-access.dto';
import { ScheduleInvalidationDto } from './dto/schedule-invalidation.dto';
import { WarmRequestDto } from './dto/warm-request.dto';
export declare class CacheWarmingController {
    private readonly cacheWarmingService;
    constructor(cacheWarmingService: CacheWarmingService);
    dashboard(): Promise<{
        currentWarmWindow: import("./entities/preload-data.entity").WarmWindow;
        redisStats: import("./redis-cache.service").RedisCacheStats;
        topCandidates: import("./entities/preload-data.entity").PreloadData[];
        recentJobs: import("./entities/cache-job.entity").CacheJob[];
        recentMetrics: import("./entities/metric.entity").Metric[];
    }>;
    preloadData(limit?: string): Promise<import("./entities/preload-data.entity").PreloadData[]>;
    upsertPreloadData(dto: CreatePreloadDataDto): Promise<import("./entities/preload-data.entity").PreloadData>;
    recordAccess(dto: RecordAccessDto): Promise<import("./entities/preload-data.entity").PreloadData>;
    candidates(limit?: string): Promise<import("./entities/preload-data.entity").PreloadData[]>;
    warm(dto: WarmRequestDto): Promise<import("./cache-warming.service").WarmingResult>;
    invalidate(dto: ScheduleInvalidationDto): Promise<number>;
    scheduleInvalidation(dto: ScheduleInvalidationDto): Promise<import("./entities/cache-job.entity").CacheJob>;
    optimizeHitRate(): Promise<import("./redis-cache.service").RedisCacheStats>;
    jobs(limit?: string): Promise<import("./entities/cache-job.entity").CacheJob[]>;
    metrics(limit?: string): Promise<import("./entities/metric.entity").Metric[]>;
    private toLimit;
}
