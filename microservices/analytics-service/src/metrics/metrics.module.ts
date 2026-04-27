import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { Metric } from './metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Metric])],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
