import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CacheWarmingService } from './cache-warming.service';
import { CreatePreloadDataDto } from './dto/create-preload-data.dto';
import { RecordAccessDto } from './dto/record-access.dto';
import { ScheduleInvalidationDto } from './dto/schedule-invalidation.dto';
import { WarmRequestDto } from './dto/warm-request.dto';
import { CacheJobType } from './entities/cache-job.entity';

@Controller('cache-warming')
export class CacheWarmingController {
  constructor(private readonly cacheWarmingService: CacheWarmingService) {}

  @Get('dashboard')
  dashboard() {
    return this.cacheWarmingService.getDashboard();
  }

  @Get('preload-data')
  preloadData(@Query('limit') limit?: string) {
    return this.cacheWarmingService.listPreloadData(this.toLimit(limit, 100));
  }

  @Post('preload-data')
  upsertPreloadData(@Body() dto: CreatePreloadDataDto) {
    return this.cacheWarmingService.upsertPreloadData(dto);
  }

  @Post('access')
  recordAccess(@Body() dto: RecordAccessDto) {
    return this.cacheWarmingService.recordAccess(dto);
  }

  @Get('candidates')
  candidates(@Query('limit') limit?: string) {
    return this.cacheWarmingService.getTopCandidates(this.toLimit(limit, 25));
  }

  @Post('warm')
  warm(@Body() dto: WarmRequestDto) {
    return this.cacheWarmingService.runWarmingJob({
      name: dto.adaptive
        ? 'manual-adaptive-cache-warming'
        : 'manual-cache-warming',
      type: dto.adaptive ? CacheJobType.ADAPTIVE : CacheJobType.WARM,
      limit: dto.limit,
      keys: dto.keys,
      adaptive: dto.adaptive,
      priority: 100,
    });
  }

  @Post('invalidate')
  invalidate(@Body() dto: ScheduleInvalidationDto) {
    return this.cacheWarmingService.invalidateNow({
      key: dto.key,
      keys: dto.keys,
      pattern: dto.pattern,
    });
  }

  @Post('invalidate/schedule')
  scheduleInvalidation(@Body() dto: ScheduleInvalidationDto) {
    return this.cacheWarmingService.scheduleInvalidation(dto);
  }

  @Post('optimize')
  optimizeHitRate() {
    return this.cacheWarmingService.optimizeHitRate();
  }

  @Get('jobs')
  jobs(@Query('limit') limit?: string) {
    return this.cacheWarmingService.listJobs(this.toLimit(limit, 50));
  }

  @Get('metrics')
  metrics(@Query('limit') limit?: string) {
    return this.cacheWarmingService.listMetrics(this.toLimit(limit, 100));
  }

  private toLimit(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
