import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesController } from './puzzles.controller';
import { CommunityPuzzlesModule } from './community-puzzles.module';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';
import { PuzzleSolutionAttempt } from './entities/puzzle-solution-attempt.entity';
import { SolutionSubmissionService } from './services/solution-submission.service';
import { AntiCheatModule } from '../anti-cheat/anti-cheat.module';

// Import entities and components for categories, collections, and themes
import { Category } from './entities/category.entity';
import { CategoriesService } from './category.service';
import { CategoriesController } from './category.controller';
import { Collection } from './entities/collection.entity';
import { CollectionsService } from './collection.service';
import { CollectionsController } from './collection.controller';
import { Theme } from './entities/theme.entity'; // Import Theme entity
import { ThemesService } from './theme.service'; // Import ThemesService
import { ThemesController } from './theme.controller'; // Import ThemesController

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Puzzle,
      PuzzleProgress,
      PuzzleRating,
      Category,
      Collection,
      Theme,
      PuzzleSolutionAttempt,
    ]),
    AntiCheatModule,
  ],
  controllers: [
    PuzzlesController,
    CategoriesController,
    CollectionsController,
    ThemesController // Add ThemesController
  ],
  providers: [
    PuzzlesService,
    CategoriesService,
    CollectionsService,
    ThemesService,
    SolutionSubmissionService,
  ],
  exports: [PuzzlesService]
})
export class PuzzlesModule { }