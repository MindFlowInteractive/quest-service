import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ELOService } from '../elo.service';
import { PlayerRating } from '../entities/player-rating.entity';
import { RatingHistory } from '../entities/rating-history.entity';
import { Season } from '../entities/season.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

describe('ELOService', () => {
  let service: ELOService;
  let playerRatingRepository: Repository<PlayerRating>;
  let ratingHistoryRepository: Repository<RatingHistory>;
  let seasonRepository: Repository<Season>;

  const mockPlayerRatingRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRatingHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSeasonRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ELOService,
        {
          provide: getRepositoryToken(PlayerRating),
          useValue: mockPlayerRatingRepository,
        },
        {
          provide: getRepositoryToken(RatingHistory),
          useValue: mockRatingHistoryRepository,
        },
        {
          provide: getRepositoryToken(Season),
          useValue: mockSeasonRepository,
        },
        {
          provide: getRepositoryToken(Puzzle),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ELOService>(ELOService);
    playerRatingRepository = module.get(getRepositoryToken(PlayerRating));
    ratingHistoryRepository = module.get(getRepositoryToken(RatingHistory));
    seasonRepository = module.get(getRepositoryToken(Season));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRatingChange', () => {
    it('should calculate positive rating change for completed easy puzzle', async () => {
      const playerRating = new PlayerRating();
      playerRating.rating = 1200;
      playerRating.gamesPlayed = 10;

      const puzzle = new Puzzle();
      puzzle.difficultyRating = 3;
      puzzle.timeLimit = 300;
      puzzle.difficulty = 'easy';

      const completionData = {
        userId: 'user1',
        puzzleId: 'puzzle1',
        puzzleDifficulty: 'easy',
        difficultyRating: 3,
        wasCompleted: true,
        timeTaken: 120,
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      };

      mockSeasonRepository.findOne.mockResolvedValue({
        seasonId: 'S001',
        defaultRating: 1200,
        status: 'active',
      });

      const result = await service.calculateRatingChange(
        playerRating,
        puzzle,
        completionData,
      );

      expect(result.ratingChange).toBeGreaterThan(0);
      expect(result.newRating).toBeGreaterThan(1200);
      expect(result.expectedWinProbability).toBeGreaterThan(0);
      expect(result.kFactor).toBe(40); // New player
    });

    it('should calculate negative rating change for failed hard puzzle', async () => {
      const playerRating = new PlayerRating();
      playerRating.rating = 1800;
      playerRating.gamesPlayed = 50;

      const puzzle = new Puzzle();
      puzzle.difficultyRating = 9;
      puzzle.timeLimit = 600;
      puzzle.difficulty = 'expert';

      const completionData = {
        userId: 'user1',
        puzzleId: 'puzzle1',
        puzzleDifficulty: 'expert',
        difficultyRating: 9,
        wasCompleted: false,
        timeTaken: 0,
        hintsUsed: 0,
        attempts: 3,
        basePoints: 300,
      };

      mockSeasonRepository.findOne.mockResolvedValue({
        seasonId: 'S001',
        defaultRating: 1200,
        status: 'active',
      });

      const result = await service.calculateRatingChange(
        playerRating,
        puzzle,
        completionData,
      );

      expect(result.ratingChange).toBeLessThan(0);
      expect(result.newRating).toBeLessThan(1800);
    });

    it('should apply time bonus for fast completion', async () => {
      const playerRating = new PlayerRating();
      playerRating.rating = 1500;
      playerRating.gamesPlayed = 30;

      const puzzle = new Puzzle();
      puzzle.difficultyRating = 5;
      puzzle.timeLimit = 300;
      puzzle.difficulty = 'medium';

      const completionData = {
        userId: 'user1',
        puzzleId: 'puzzle1',
        puzzleDifficulty: 'medium',
        difficultyRating: 5,
        wasCompleted: true,
        timeTaken: 90, // Very fast (30% of time limit)
        hintsUsed: 0,
        attempts: 1,
        basePoints: 100,
      };

      mockSeasonRepository.findOne.mockResolvedValue({
        seasonId: 'S001',
        defaultRating: 1200,
        status: 'active',
      });

      const result = await service.calculateRatingChange(
        playerRating,
        puzzle,
        completionData,
      );

      // Should have time bonus
      expect(result.bonusFactors).toContain('time_bonus');
      expect(result.ratingChange).toBeGreaterThan(10);
    });

    it('should apply hint penalty', async () => {
      const playerRating = new PlayerRating();
      playerRating.rating = 1400;
      playerRating.gamesPlayed = 20;

      const puzzle = new Puzzle();
      puzzle.difficultyRating = 4;
      puzzle.timeLimit = 240;
      puzzle.difficulty = 'medium';

      const completionData = {
        userId: 'user1',
        puzzleId: 'puzzle1',
        puzzleDifficulty: 'medium',
        difficultyRating: 4,
        wasCompleted: true,
        timeTaken: 180,
        hintsUsed: 2,
        attempts: 1,
        basePoints: 100,
      };

      mockSeasonRepository.findOne.mockResolvedValue({
        seasonId: 'S001',
        defaultRating: 1200,
        status: 'active',
      });

      const result = await service.calculateRatingChange(
        playerRating,
        puzzle,
        completionData,
      );

      // Should have hint penalty
      expect(result.bonusFactors).toContain('hint_penalty_2');
      expect(result.ratingChange).toBeLessThan(20); // Reduced due to penalty
    });
  });

  describe('getSkillTier', () => {
    it('should return BRONZE for rating < 1200', () => {
      expect(service.getSkillTier(1100)).toBe('bronze');
    });

    it('should return SILVER for rating 1200-1399', () => {
      expect(service.getSkillTier(1300)).toBe('silver');
    });

    it('should return GOLD for rating 1400-1599', () => {
      expect(service.getSkillTier(1500)).toBe('gold');
    });

    it('should return PLATINUM for rating 1600-1799', () => {
      expect(service.getSkillTier(1700)).toBe('platinum');
    });

    it('should return DIAMOND for rating 1800-1999', () => {
      expect(service.getSkillTier(1900)).toBe('diamond');
    });

    it('should return MASTER for rating 2000-2399', () => {
      expect(service.getSkillTier(2200)).toBe('master');
    });

    it('should return GRANDMASTER for rating >= 2400', () => {
      expect(service.getSkillTier(2500)).toBe('grandmaster');
    });
  });

  describe('calculateInactivityDecay', () => {
    it('should return 0 for inactive less than 30 days', () => {
      expect(service.calculateInactivityDecay(1500, 20)).toBe(0);
    });

    it('should apply decay for 30+ days inactive', () => {
      const decay = service.calculateInactivityDecay(1500, 37); // 1 week = 7 days
      expect(decay).toBeLessThan(0);
      expect(decay).toBe(-2); // 1 week * 2 points
    });

    it('should not decay below minimum rating', () => {
      const decay = service.calculateInactivityDecay(105, 100); // Would go below 100
      expect(105 + decay).toBeGreaterThanOrEqual(100);
    });
  });
});
