import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationsController } from '../controllers/recommendations.controller';
import { RecommendationEngineService } from '../services/recommendation-engine.service';
import { PreferenceTrackingService } from '../services/preference-tracking.service';

describe('RecommendationsController', () => {
  let controller: RecommendationsController;
  let recommendationEngineService: jest.Mocked<RecommendationEngineService>;
  let preferenceTrackingService: jest.Mocked<PreferenceTrackingService>;

  beforeEach(async () => {
    const mockRecommendationEngine = {
      generateRecommendations: jest.fn(),
      trackInteraction: jest.fn(),
      getRecommendationMetrics: jest.fn(),
    };

    const mockPreferenceTracking = {
      onPuzzleCompleted: jest.fn(),
      onPuzzleRated: jest.fn(),
      getPreferenceInsights: jest.fn(),
      updateUserPreferences: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationsController],
      providers: [
        {
          provide: RecommendationEngineService,
          useValue: mockRecommendationEngine,
        },
        {
          provide: PreferenceTrackingService,
          useValue: mockPreferenceTracking,
        },
      ],
    }).compile();

    controller = module.get<RecommendationsController>(RecommendationsController);
    recommendationEngineService = module.get(RecommendationEngineService);
    preferenceTrackingService = module.get(PreferenceTrackingService);
  });

  describe('getRecommendations', () => {
    it('should return recommendations for a user', async () => {
      const userId = 'test-user';
      const mockRecommendations = [
        {
          puzzleId: 'puzzle1',
          puzzle: {
            id: 'puzzle1',
            title: 'Test Puzzle',
            description: 'A test puzzle',
            category: 'logic',
            difficulty: 'medium',
            difficultyRating: 5,
            averageRating: 4.2,
            completions: 100,
            tags: ['challenging'],
          },
          score: 0.85,
          reason: 'Based on your logic puzzle preferences',
          algorithm: 'hybrid',
          metadata: { category: 'logic' },
        },
      ];

      recommendationEngineService.generateRecommendations.mockResolvedValue(mockRecommendations);

      const result = await controller.getRecommendations(userId, 10);

      expect(recommendationEngineService.generateRecommendations).toHaveBeenCalledWith(
        userId,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toHaveLength(1);
      expect(result[0].puzzleId).toBe('puzzle1');
      expect(result[0].score).toBe(0.85);
    });

    it('should handle filters correctly', async () => {
      const userId = 'test-user';
      
      recommendationEngineService.generateRecommendations.mockResolvedValue([]);

      await controller.getRecommendations(
        userId,
        5,
        'logic',
        'hard',
        'collaborative',
        'test-group'
      );

      expect(recommendationEngineService.generateRecommendations).toHaveBeenCalledWith(
        userId,
        5,
        'logic',
        'hard',
        'collaborative',
        'test-group',
      );
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction', async () => {
      const trackDto = {
        userId: 'test-user',
        puzzleId: 'test-puzzle',
        interactionType: 'click' as const,
        value: 4.5,
        metadata: { source: 'recommendation' },
      };

      recommendationEngineService.trackInteraction.mockResolvedValue();

      const result = await controller.trackInteraction(trackDto);

      expect(recommendationEngineService.trackInteraction).toHaveBeenCalledWith(
        trackDto.userId,
        trackDto.puzzleId,
        trackDto.interactionType,
        trackDto.value,
        trackDto.metadata,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('recordPuzzleCompletion', () => {
    it('should record puzzle completion', async () => {
      const completionData = {
        userId: 'test-user',
        puzzleId: 'test-puzzle',
        completionTime: 120,
        hintsUsed: 2,
        attempts: 3,
        score: 850,
      };

      preferenceTrackingService.onPuzzleCompleted.mockResolvedValue();

      const result = await controller.recordPuzzleCompletion(completionData);

      expect(preferenceTrackingService.onPuzzleCompleted).toHaveBeenCalledWith(
        completionData.userId,
        completionData.puzzleId,
        completionData.completionTime,
        completionData.hintsUsed,
        completionData.attempts,
        completionData.score,
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preference insights', async () => {
      const userId = 'test-user';
      const mockInsights = {
        topCategories: [
          { category: 'logic', score: 0.8, interactions: 15 },
          { category: 'math', score: 0.6, interactions: 8 },
        ],
        preferredDifficulty: 'medium',
        totalInteractions: 23,
        averageCompletionTime: 145,
        topTags: ['challenging', 'pattern', 'analytical'],
      };

      preferenceTrackingService.getPreferenceInsights.mockResolvedValue(mockInsights);

      const result = await controller.getUserPreferences(userId);

      expect(preferenceTrackingService.getPreferenceInsights).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockInsights);
    });
  });

  describe('getMetrics', () => {
    it('should return recommendation metrics', async () => {
      const mockMetrics = [
        {
          algorithm: 'hybrid',
          totalRecommendations: 1000,
          views: 800,
          clicks: 240,
          completions: 120,
          clickThroughRate: 0.3,
          completionRate: 0.5,
          averageScore: 0.75,
        },
      ];

      recommendationEngineService.getRecommendationMetrics.mockResolvedValue(mockMetrics);

      const result = await controller.getMetrics();

      expect(recommendationEngineService.getRecommendationMetrics).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(result).toEqual(mockMetrics);
    });
  });
});