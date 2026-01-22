import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesController } from './puzzles.controller';
import { CommunityPuzzlesModule } from './community-puzzles.module';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Puzzle,
      PuzzleProgress,
      PuzzleRating
    ]),
    CommunityPuzzlesModule,
  ],
  controllers: [PuzzlesController],
  providers: [PuzzlesService],
  exports: [PuzzlesService]
})
export class PuzzlesModule {}
