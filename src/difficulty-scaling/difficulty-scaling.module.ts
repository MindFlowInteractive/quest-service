import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DifficultyScalingService } from './difficulty-scaling.service';
import { PlayerSkillService } from './player-skill.service';
import { PuzzleDifficultyService } from './puzzle-difficulty.service';
import { UserStats } from '../users/entities/user-stats.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../puzzles/entities/puzzle-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserStats, Puzzle, PuzzleRating])],
  providers: [DifficultyScalingService, PlayerSkillService, PuzzleDifficultyService],
  exports: [DifficultyScalingService, PlayerSkillService, PuzzleDifficultyService],
})
export class DifficultyScalingModule {}
