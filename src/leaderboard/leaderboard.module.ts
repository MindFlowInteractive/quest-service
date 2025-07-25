import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([Leaderboard, LeaderboardEntry]),
    AchievementsModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {} 