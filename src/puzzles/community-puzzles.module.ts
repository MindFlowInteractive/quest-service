import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Entities
import { UserPuzzleSubmission } from './entities/user-puzzle-submission.entity';
import { PuzzleComment } from './entities/puzzle-comment.entity';

// Services
import { UserPuzzleSubmissionService } from './services/user-puzzle-submission.service';
import { PuzzleValidationService } from './services/puzzle-validation.service';
import { PuzzleModerationService } from './services/puzzle-moderation.service';
import { CommunityPuzzlesService } from './services/community-puzzles.service';
import { FeaturedPuzzlesService } from './services/featured-puzzles.service';
import { CreatorRewardsService } from './services/creator-rewards.service';

// Controllers
import { CommunityPuzzlesController } from './controllers/community-puzzles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPuzzleSubmission, PuzzleComment]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CommunityPuzzlesController],
  providers: [
    // Services
    UserPuzzleSubmissionService,
    PuzzleValidationService,
    PuzzleModerationService,
    CommunityPuzzlesService,
    FeaturedPuzzlesService,
    CreatorRewardsService,
    
    // Guards
    JwtAuthGuard,
  ],
  exports: [
    // Services for other modules to use
    UserPuzzleSubmissionService,
    PuzzleValidationService,
    PuzzleModerationService,
    CommunityPuzzlesService,
    FeaturedPuzzlesService,
    CreatorRewardsService,
  ],
})
export class CommunityPuzzlesModule {}
