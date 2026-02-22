import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillRatingService } from './skill-rating.service';
import { SkillRatingController } from './skill-rating.controller';
import { PlayerRating } from './entities/player-rating.entity';
import { RatingHistory } from './entities/rating-history.entity';
import { Season } from './entities/season.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayerRating, RatingHistory, Season]),
    ScheduleModule.forRoot(),
  ],
  controllers: [SkillRatingController],
  providers: [SkillRatingService],
  exports: [SkillRatingService],
})
export class SkillRatingModule {}
