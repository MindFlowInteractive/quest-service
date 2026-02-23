import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleReplay } from './entities/puzzle-replay.entity';
import { ReplayAction } from './entities/replay-action.entity';
import { ReplayAnalytic } from './entities/replay-analytic.entity';
import { ReplayService } from './services/replay.service';
import { ReplayCompressionService } from './services/replay-compression.service';
import { ReplayComparisonService } from './services/replay-comparison.service';
import { ReplayAnalyticsService } from './services/replay-analytics.service';
import { ReplayController } from './controllers/replay.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PuzzleReplay, ReplayAction, ReplayAnalytic])],
  providers: [
    ReplayService,
    ReplayCompressionService,
    ReplayComparisonService,
    ReplayAnalyticsService,
  ],
  controllers: [ReplayController],
  exports: [
    ReplayService,
    ReplayCompressionService,
    ReplayComparisonService,
    ReplayAnalyticsService,
  ],
})
export class ReplayModule {}
