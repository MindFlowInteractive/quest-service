import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheWarmingController } from './cache-warming.controller';
import { CacheWarmingScheduler } from './cache-warming.scheduler';
import { CacheWarmingService } from './cache-warming.service';
import { CacheJob } from './entities/cache-job.entity';
import { Metric } from './entities/metric.entity';
import { PreloadData } from './entities/preload-data.entity';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([CacheJob, PreloadData, Metric])],
  controllers: [CacheWarmingController],
  providers: [CacheWarmingService, CacheWarmingScheduler, RedisCacheService],
  exports: [CacheWarmingService],
})
export class CacheWarmingModule {}
