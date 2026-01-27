import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import {
  SeasonalEvent,
  EventPuzzle,
  PlayerEvent,
  EventReward,
} from './entities';
import {
  SeasonalEventService,
  EventPuzzleService,
  PlayerEventService,
  LeaderboardService,
  EventRewardService,
} from './services';
import { SeasonalEventsController } from './seasonal-events.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeasonalEvent,
      EventPuzzle,
      PlayerEvent,
      EventReward,
    ]),
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [SeasonalEventsController],
  providers: [
    SeasonalEventService,
    EventPuzzleService,
    PlayerEventService,
    LeaderboardService,
    EventRewardService,
  ],
  exports: [
    SeasonalEventService,
    EventPuzzleService,
    PlayerEventService,
    LeaderboardService,
    EventRewardService,
  ],
})
export class SeasonalEventsModule {}
