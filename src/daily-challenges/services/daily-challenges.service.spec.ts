import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailyChallengesService } from './daily-challenges.service';
import { DailyChallenge } from '../entities/daily-challenge.entity';
import { DailyChallengeCompletion } from '../entities/daily-challenge-completion.entity';
import { UserStreak } from '../../users/entities/user-streak.entity';
import { User } from '../../users/entities/user.entity';

describe('DailyChallengesService', () => {
  let service: DailyChallengesService;
  let userStreakRepo: any;
  let completionRepo: any;
  let dailyChallengeRepo: any;
  let userRepo: any;

  beforeEach(async () => {
    userStreakRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    completionRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };
    dailyChallengeRepo = {
      findOne: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyChallengesService,
        {
          provide: getRepositoryToken(DailyChallenge),
          useValue: dailyChallengeRepo,
        },
        {
          provide: getRepositoryToken(DailyChallengeCompletion),
          useValue: completionRepo,
        },
        { provide: getRepositoryToken(UserStreak), useValue: userStreakRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<DailyChallengesService>(DailyChallengesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('streak tracking and bonus logic', () => {
    it('should create a new streak on first completion', async () => {
      const challengeId = 'c1';
      const userId = 'u1';
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
      });
      completionRepo.findOne.mockResolvedValue(null);
      userStreakRepo.findOne.mockResolvedValue(null);

      const mockUser = { id: userId };
      userRepo.findOne.mockResolvedValue(mockUser);

      const newStreak = {
        user: mockUser,
        currentStreak: 1,
        streakStartDate: new Date(),
        lastPuzzleCompletedAt: new Date(),
      };
      userStreakRepo.create.mockReturnValue(newStreak);
      userStreakRepo.save.mockResolvedValue(newStreak);

      const completion = { id: 'comp1', streakBonusAwarded: 0 };
      completionRepo.create.mockReturnValue(completion);

      const result = await service.completeChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(1);
      expect(result.bonusPointsAwarded).toBe(0);
      expect(userStreakRepo.create).toHaveBeenCalled();
      expect(userStreakRepo.save).toHaveBeenCalled();
    });

    it('should increment streak when completed on consecutive days', async () => {
      const challengeId = 'c2';
      const userId = 'u2';
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
      });
      completionRepo.findOne.mockResolvedValue(null);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const mockStreak = {
        user: { id: userId },
        currentStreak: 3,
        lastPuzzleCompletedAt: yesterday,
      };
      userStreakRepo.findOne.mockResolvedValue(mockStreak);
      userStreakRepo.save.mockResolvedValue(mockStreak);
      completionRepo.create.mockReturnValue({});

      const result = await service.completeChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(4);
      expect(result.bonusPointsAwarded).toBe(15); // 0.05 * 3 = 0.15 * 100 = 15
      expect(userStreakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 4,
        }),
      );
    });

    it('should reset streak when a day is missed without a grace period', async () => {
      const challengeId = 'c3';
      const userId = 'u3';
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
      });
      completionRepo.findOne.mockResolvedValue(null);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setUTCHours(0, 0, 0, 0);

      const mockStreak = {
        user: { id: userId },
        currentStreak: 5,
        lastPuzzleCompletedAt: twoDaysAgo,
      };
      userStreakRepo.findOne.mockResolvedValue(mockStreak);
      userStreakRepo.save.mockResolvedValue(mockStreak);
      completionRepo.create.mockReturnValue({});

      const result = await service.completeChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(1);
      expect(result.bonusPointsAwarded).toBe(0);
      expect(userStreakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 1,
        }),
      );
    });

    it('should maintain streak when a day is missed but within grace period', async () => {
      const challengeId = 'c4';
      const userId = 'u4';
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
      });
      completionRepo.findOne.mockResolvedValue(null);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setUTCHours(0, 0, 0, 0);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockStreak = {
        user: { id: userId },
        currentStreak: 5,
        lastPuzzleCompletedAt: twoDaysAgo,
        streakRecoveryGracePeriodEnd: tomorrow,
      };

      userStreakRepo.findOne.mockResolvedValue(mockStreak);
      userStreakRepo.save.mockResolvedValue(mockStreak);
      completionRepo.create.mockReturnValue({});

      const result = await service.completeChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(6); // Grace period saved the day!
      expect(userStreakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 6,
        }),
      );
    });
  });
});
