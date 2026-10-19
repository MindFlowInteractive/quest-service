import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HintsService } from './hints.service';
import { HintsController } from './hints.controller';
import { PlayerEventsModule } from '../player-events/player-events.module';
import { Hint } from './entities/hint.entity';
import { HintUsage } from './entities/hint-usage.entity';
import { HintTemplate } from './entities/hint-template.entity';
import { PuzzlesModule } from '../puzzles/puzzles.module';
import { HintCostService } from './services/hint-cost.service';
import { HintCacheService } from './services/hint-cache.service';
import { HintLimitsService } from './services/hint-limits.service';
import { HintAnalyticsService } from './services/hint-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hint, HintUsage, HintTemplate]),
    PuzzlesModule,
    PlayerEventsModule,
  ],
  controllers: [HintsController],
  providers: [
    HintsService,
    HintCostService,
    HintCacheService,
    HintLimitsService,
    HintAnalyticsService,
  ],
  exports: [HintsService, HintAnalyticsService],
})
export class HintsModule {}
