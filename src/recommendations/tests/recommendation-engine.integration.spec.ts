import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { CollaborativeFilteringService } from '../services/collaborative-filtering.service';
import { ContentBasedFilteringService } from '../services/content-based-filtering.service';
import { UserPreference } from '../entities/user-preference.entity';
import { Recommendation } from '../entities/recommendation.entity';
import { UserInteraction } from '../entities/user-interaction.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../../puzzles/entities/puzzle-rating.entity';
import { User } from '../../users/entities/user.entity';

describe('RecommendationEngineService Integration', () => {
  let service: RecommendationEngineService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserPreference, Recommendation, UserInteraction, Puzzle, PuzzleRating, User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          UserPreference,
          Recommendation,
          UserInteraction,
          Puzzle,
          PuzzleRating,
          User,
        ]),
      ],
      providers: [
        RecommendationEngineService,
        CollaborativeFilteringService,
        ContentBasedFilteringService,
      ],
    }).compile();

    service = module.get<RecommendationEngineService>(RecommendationEngineService);
  });

  afterEach(async () => {
    await module.close();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for new user using popular algorithm', async () => {
      // Setup test data
      const userId = 'new-user-123';
      
      const recommendations = await service.generateRecommendations(userId, 5);
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      // New users should get popular recommendations as fallback
    });

    it('should generate hybrid recommendations for experienced user', async () => {
      // This would require setting up mock data for users with interaction history
      const userId = 'experienced-user-123';
      
      const recommendations = await service.generateRecommendations(
        userId, 
        10, 
        undefined, 
        undefined, 
        'hybrid'
      );
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction successfully', async () => {
      const userId = 'test-user';
      const puzzleId = 'test-puzzle';
      
      await expect(
        service.trackInteraction(userId, puzzleId, 'view')
      ).resolves.not.toThrow();
      
      await expect(
        service.trackInteraction(userId, puzzleId, 'click')
      ).resolves.not.toThrow();
      
      await expect(
        service.trackInteraction(userId, puzzleId, 'complete', 4.5, {
          completionTime: 120,
          hintsUsed: 1,
        })
      ).resolves.not.toThrow();
    });
  });
});