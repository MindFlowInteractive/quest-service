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
import { PuzzleReview } from './entities/puzzle-review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { PuzzleRatingAggregate } from './entities/puzzle-rating-aggregate.entity';
import { UserPuzzleSubmission } from './entities/user-puzzle-submission.entity';
import { PuzzleRatingService } from './services/puzzle-rating.service';
import { PuzzleReviewService } from './services/puzzle-review.service';
import { PuzzleModerationService } from './services/puzzle-moderation.service';
import { PuzzleValidationService } from './services/puzzle-validation.service';
import { CreatorRewardsService } from './services/creator-rewards.service';
import { FeaturedPuzzlesService } from './services/featured-puzzles.service';
import { PuzzleRatingController } from './controllers/puzzle-rating.controller';
import { PuzzleReviewController } from './controllers/puzzle-review.controller';

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
import { LocalizationModule } from '../common/i18n/localization.module';

@Module({
  imports: [
    LocalizationModule,
    TypeOrmModule.forFeature([
      Puzzle,
      PuzzleProgress,
      PuzzleRating,
      PuzzleReview,
      ReviewVote,
      PuzzleRatingAggregate,
      UserPuzzleSubmission,
      Category,
      Collection,
      Theme,
      PuzzleSolutionAttempt,
    ]),
    AntiCheatModule,
  ],
  controllers: [
    PuzzlesController,
    PuzzleRatingController,
    PuzzleReviewController,
    CategoriesController,
    CollectionsController,
    ThemesController // Add ThemesController
  ],
  providers: [
    PuzzlesService,
    PuzzleRatingService,
    PuzzleReviewService,
    PuzzleModerationService,
    PuzzleValidationService,
    CreatorRewardsService,
    FeaturedPuzzlesService,
    CategoriesService,
    CollectionsService,
    ThemesService,
    SolutionSubmissionService,
  ],
  exports: [PuzzlesService, PuzzleModerationService, PuzzleValidationService, SolutionSubmissionService]
})
export class PuzzlesModule { }