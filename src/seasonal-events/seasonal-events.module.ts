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
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SeasonalEvent,
      EventPuzzle,
      PlayerEvent,
      EventReward,
    ]),
    ScheduleModule.forRoot(),
    NotificationsModule,
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
