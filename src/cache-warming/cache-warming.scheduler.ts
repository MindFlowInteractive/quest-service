import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheWarmingService } from './cache-warming.service';
import { CacheJobType } from './entities/cache-job.entity';

@Injectable()
export class CacheWarmingScheduler {
  private readonly logger = new Logger(CacheWarmingScheduler.name);

  constructor(
    private readonly cacheWarmingService: CacheWarmingService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueJobs() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    const jobs = await this.cacheWarmingService.processDueJobs();

    if (jobs.length > 0) {
      this.logger.log(`Processed ${jobs.length} scheduled cache warming jobs`);
    }
  }

  @Cron('*/5 * * * *')
  async warmPopularData() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    await this.cacheWarmingService.runWarmingJob({
      name: 'scheduled-popular-cache-warming',
      type: CacheJobType.WARM,
      limit: Number(
        this.configService.get<string>('CACHE_WARMING_LIMIT') || '50',
      ),
      priority: 25,
    });
  }

  @Cron('*/15 * * * *')
  async invalidateExpiredSchedules() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    const invalidated =
      await this.cacheWarmingService.invalidateDuePreloadData();

    if (invalidated > 0) {
      this.logger.log(`Invalidated ${invalidated} keys from preload schedules`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async adaptiveWarming() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    await this.cacheWarmingService.runWarmingJob({
      name: 'adaptive-time-window-cache-warming',
      type: CacheJobType.ADAPTIVE,
      limit: Number(
        this.configService.get<string>('CACHE_ADAPTIVE_WARMING_LIMIT') || '30',
      ),
      adaptive: true,
      priority: 40,
      metadata: {
        warmWindow: this.cacheWarmingService.getCurrentWarmWindow(),
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async optimizeHitRate() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    const stats = await this.cacheWarmingService.optimizeHitRate();
    this.logger.log(
      `Cache hit rate sample: ${(stats.hitRate * 100).toFixed(2)}%`,
    );
  }

  private isSchedulerEnabled(): boolean {
    return (
      this.configService.get<string>(
        'CACHE_WARMING_SCHEDULER_ENABLED',
        'true',
      ) !== 'false'
    );
  }
}
