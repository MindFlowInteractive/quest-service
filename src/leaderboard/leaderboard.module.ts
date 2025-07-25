import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';

@Module({
  imports: [
    CacheModule.register(),
    TypeOrmModule.forFeature([Leaderboard, LeaderboardEntry]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {} 