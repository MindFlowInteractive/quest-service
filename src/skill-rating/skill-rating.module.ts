import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillRatingService } from './skill-rating.service';
import { SkillRatingController } from './skill-rating.controller';
import { PlayerRatingController, RatingsController } from './controllers/rating.controller';
import { PlayerRating } from './entities/player-rating.entity';
import { RatingHistory } from './entities/rating-history.entity';
import { Season } from './entities/season.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { ELOService } from './elo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerRating, RatingHistory, Season, User, Puzzle]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SkillRatingController, PlayerRatingController, RatingsController],
  providers: [SkillRatingService, ELOService],
  exports: [SkillRatingService],
})
export class SkillRatingModule {}
