import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Replay } from '../entities/replay.entity';
import { Action } from '../entities/action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Replay, Action])],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
