import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { Recommendation } from './entities/recommendation.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { UserPreference } from './entities/user-preference.entity';
import { RecommendationFeedback } from './entities/recommendation-feedback.entity';
import { UserProgress } from '../user-progress/entities/user-progress.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { CacheModule } from '../cache/cache.module';
import { DifficultyScalingModule } from '../difficulty-scaling/difficulty-scaling.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recommendation,
      UserInteraction,
      UserPreference,
      RecommendationFeedback,
      UserProgress,
      Puzzle,
    ]),
    CacheModule,
    DifficultyScalingModule,
    AnalyticsModule,
  ],
  providers: [RecommendationsService],
  controllers: [RecommendationsController],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}