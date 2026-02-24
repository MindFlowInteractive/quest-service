import { Module } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { PerformanceInterceptor } from './performance.interceptor';
import { MetricsController } from './metrics.controller';
import { AlertingService } from './alerting.service';

@Module({
  providers: [
    PerformanceService,
    PerformanceInterceptor,
    AlertingService,
  ],
  controllers: [MetricsController],
  exports: [PerformanceService, PerformanceInterceptor, AlertingService],
})
export class PerformanceModule {}
