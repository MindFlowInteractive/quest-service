import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillRatingService } from './skill-rating.service';
import { SkillRatingController } from './skill-rating.controller';
import {
  PlayerRatingController,
  RatingsController,
} from './controllers/rating.controller';
import { PlayerRating } from './entities/player-rating.entity';
import { RatingHistory } from './entities/rating-history.entity';
import { Season } from './entities/season.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { ELOService } from './elo.service';
import { NotificationService } from '../notifications/notification.service';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationDelivery } from '../notifications/entities/notification-delivery.entity';
import { Device } from '../notifications/entities/device.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerRating,
      RatingHistory,
      Season,
      User,
      Puzzle,
      Notification,
      NotificationDelivery,
      Device,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    SkillRatingController,
    PlayerRatingController,
    RatingsController,
  ],
  providers: [SkillRatingService, ELOService, NotificationService],
  exports: [SkillRatingService],
})
export class SkillRatingModule {}