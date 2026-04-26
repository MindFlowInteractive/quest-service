import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { Leaderboard } from './entities/leaderboard.entity';
import { Rank } from './entities/rank.entity';
import { Score } from './entities/score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Leaderboard, Rank, Score])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}