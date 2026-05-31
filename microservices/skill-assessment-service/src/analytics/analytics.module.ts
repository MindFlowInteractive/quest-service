import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Assessment } from '../assessment/entities/assessment.entity';
import { Result } from '../result/entities/result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, Result])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
