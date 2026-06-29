import { ConfigService } from '@nestjs/config';
import { CacheWarmingService } from './cache-warming.service';
export declare class CacheWarmingScheduler {
    private readonly cacheWarmingService;
    private readonly configService;
    private readonly logger;
    constructor(cacheWarmingService: CacheWarmingService, configService: ConfigService);
    processDueJobs(): Promise<void>;
    warmPopularData(): Promise<void>;
    invalidateExpiredSchedules(): Promise<void>;
    adaptiveWarming(): Promise<void>;
    optimizeHitRate(): Promise<void>;
    private isSchedulerEnabled;
}
