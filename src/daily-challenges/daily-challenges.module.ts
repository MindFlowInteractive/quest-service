import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { DailyChallenge } from './entities/daily-challenge.entity';
import { DailyChallengeCompletion } from './entities/daily-challenge-completion.entity';
import { DailyChallengesService } from './services/daily-challenges.service';
import { ChallengeRotationCron } from './services/challenge-rotation.cron';
import { DailyChallengesController } from './controllers/daily-challenges.controller';

import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyChallenge,
      DailyChallengeCompletion,
      Puzzle,
      UserStreak,
      User,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [DailyChallengesController],
  providers: [DailyChallengesService, ChallengeRotationCron],
  exports: [DailyChallengesService],
})
export class DailyChallengesModule {}
