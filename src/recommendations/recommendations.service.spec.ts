import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecommendationsService } from './recommendations.service';
import { UserProgress } from '../user-progress/entities/user-progress.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { UserInteraction } from './entities/user-interaction.entity';
import { RecommendationFeedback } from './entities/recommendation-feedback.entity';
import { CacheService } from '../cache/services/cache.service';
import { PuzzleDifficultyService } from '../difficulty-scaling/puzzle-difficulty.service';
import { AnalyticsService } from '../analytics/analytics.service';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let userProgressRepo: Repository<UserProgress>;
  let puzzleRepo: Repository<Puzzle>;
  let interactionRepo: Repository<UserInteraction>;
  let feedbackRepo: Repository<RecommendationFeedback>;
  let cacheService: CacheService;
  let difficultyService: PuzzleDifficultyService;
  let analyticsService: AnalyticsService;

  const mockUserProgress = {
    id: 'up1',
    userId: 'user1',
    solvedPuzzles: ['puzzle1', 'puzzle2'],
    xp: 100,
    level: 2,
  };

  const mockPuzzle = {
    id: 'puzzle3',
    title: 'Test Puzzle',
    description: 'A test puzzle',
    category: 'logic',
    difficulty: 'medium',
    difficultyRating: 5,
    basePoints: 100,
    timeLimit: 300,
    tags: ['logic', 'math'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    isActive: true,
    publishedAt: new Date(),
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [mockPuzzle],
        raw: [{ completionsLast7Days: '5' }],
      }),
      getRawMany: jest.fn().mockResolvedValue([
        { category: 'logic', count: '3' },
        { category: 'pattern', count: '2' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: getRepositoryToken(UserProgress),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUserProgress),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(UserInteraction),
          useValue: {
            find: jest.fn().mockResolvedValue([
              { puzzle: { difficultyRating: 5 } },
              { puzzle: { difficultyRating: 4 } },
            ]),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(RecommendationFeedback),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PuzzleDifficultyService,
          useValue: {
            getPuzzleDifficulty: jest.fn(),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackEvent: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    userProgressRepo = module.get<Repository<UserProgress>>(getRepositoryToken(UserProgress));
    puzzleRepo = module.get<Repository<Puzzle>>(getRepositoryToken(Puzzle));
    interactionRepo = module.get<Repository<UserInteraction>>(getRepositoryToken(UserInteraction));
    feedbackRepo = module.get<Repository<RecommendationFeedback>>(getRepositoryToken(RecommendationFeedback));
    cacheService = module.get<CacheService>(CacheService);
    difficultyService = module.get<PuzzleDifficultyService>(PuzzleDifficultyService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPersonalizedRecommendations', () => {
    it('should return personalized recommendations for existing user', async () => {
      const result = await service.getPersonalizedRecommendations('user1', 5);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('score');
      expect(result[0]).toHaveProperty('reason');
    });

    it('should return trending recommendations for new user (empty history fallback)', async () => {
      jest.spyOn(userProgressRepo, 'findOne').mockResolvedValue(null);

      const result = await service.getPersonalizedRecommendations('new-user', 5);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use cached results when available', async () => {
      const cachedResult = [{ id: 'cached-puzzle', title: 'Cached', score: 0.8, reason: 'cached' }];
      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedResult);

      const result = await service.getPersonalizedRecommendations('user1', 5);

      expect(result).toEqual(cachedResult);
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should cache results with 1-hour TTL', async () => {
      await service.getPersonalizedRecommendations('user1', 5);

      expect(cacheService.set).toHaveBeenCalledWith(
        'recommendations:personalized:user1:5',
        expect.any(Array),
        { ttl: 3600 }
      );
    });
  });

  describe('getTrendingRecommendations', () => {
    it('should return top puzzles by recent completions', async () => {
      const result = await service.getTrendingRecommendations(5);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('completionsLast7Days');
    });

    it('should use cached results when available', async () => {
      const cachedResult = [{ id: 'trending-puzzle', completionsLast7Days: 10 }];
      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedResult);

      const result = await service.getTrendingRecommendations(5);

      expect(result).toEqual(cachedResult);
    });
  });

  describe('submitFeedback', () => {
    it('should save feedback and track analytics event', async () => {
      const feedback = {
        puzzleId: 'puzzle1',
        feedbackType: 'helpful' as const,
        comment: 'Great recommendation!',
      };

      await service.submitFeedback('user1', feedback);

      expect(feedbackRepo.create).toHaveBeenCalled();
      expect(feedbackRepo.save).toHaveBeenCalled();
      expect(analyticsService.trackEvent).toHaveBeenCalled();
    });
  });
});
