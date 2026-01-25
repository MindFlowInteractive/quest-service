import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsController } from './controllers/recommendations.controller';
import { RecommendationEngineService } from './services/recommendation-engine.service';
import { CollaborativeFilteringService } from './services/collaborative-filtering.service';
import { ContentBasedFilteringService } from './services/content-based-filtering.service';
import { PreferenceTrackingService } from './services/preference-tracking.service';
import { UserPreference } from './entities/user-preference.entity';
import { Recommendation } from './entities/recommendation.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../puzzles/entities/puzzle-rating.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserPreference,
      Recommendation,
      UserInteraction,
      Puzzle,
      PuzzleRating,
      User,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationEngineService,
    CollaborativeFilteringService,
    ContentBasedFilteringService,
    PreferenceTrackingService,
  ],
  exports: [
    RecommendationEngineService,
    PreferenceTrackingService,
    CollaborativeFilteringService,
    ContentBasedFilteringService,
  ],
})
export class RecommendationsModule {}