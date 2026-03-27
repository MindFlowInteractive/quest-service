import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { DailyChallenge } from './entities/daily-challenge.entity';
import { DailyChallengeCompletion } from './entities/daily-challenge-completion.entity';
import { WeeklyChallenge } from './entities/weekly-challenge.entity';
import { WeeklyChallengeCompletion } from './entities/weekly-challenge-completion.entity';
import { DailyChallengesService } from './services/daily-challenges.service';
import { ChallengeRotationCron } from './services/challenge-rotation.cron';
import { ChallengeSeeder } from './services/challenge-seeder.service';
import { DailyChallengesController } from './controllers/daily-challenges.controller';

import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UserStreak } from '../users/entities/user-streak.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailyChallenge,
      DailyChallengeCompletion,
      WeeklyChallenge,
      WeeklyChallengeCompletion,
      Puzzle,
      UserStreak,
      User,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [DailyChallengesController],
  providers: [DailyChallengesService, ChallengeRotationCron, ChallengeSeeder],
  exports: [DailyChallengesService, ChallengeSeeder],
})
export class DailyChallengesModule {}
