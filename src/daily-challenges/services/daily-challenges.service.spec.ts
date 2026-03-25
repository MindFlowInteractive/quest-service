import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DailyChallengesService } from './daily-challenges.service';
import { DailyChallenge } from '../entities/daily-challenge.entity';
import { DailyChallengeCompletion } from '../entities/daily-challenge-completion.entity';
import { WeeklyChallenge } from '../entities/weekly-challenge.entity';
import { WeeklyChallengeCompletion } from '../entities/weekly-challenge-completion.entity';
import { UserStreak } from '../../users/entities/user-streak.entity';
import { User } from '../../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DailyChallengesService', () => {
  let service: DailyChallengesService;
  let userStreakRepo: any;
  let completionRepo: any;
  let dailyChallengeRepo: any;
  let weeklyCompletionRepo: any;
  let weeklyChallengeRepo: any;
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
      increment: jest.fn(),
    };
    weeklyCompletionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    weeklyChallengeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      increment: jest.fn(),
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
        {
          provide: getRepositoryToken(WeeklyChallenge),
          useValue: weeklyChallengeRepo,
        },
        {
          provide: getRepositoryToken(WeeklyChallengeCompletion),
          useValue: weeklyCompletionRepo,
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
        bonusXP: 50,
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

      const completion = { id: 'comp1', streakBonusAwarded: 0, bonusXPAwarded: 50, bonusXPClaimed: false };
      completionRepo.create.mockReturnValue(completion);
      completionRepo.save.mockResolvedValue(completion);
      dailyChallengeRepo.increment.mockResolvedValue({});

      const result = await service.completeDailyChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(1);
      expect(result.bonusPointsAwarded).toBe(0);
      expect(result.bonusXPAwarded).toBe(50);
      expect(userStreakRepo.create).toHaveBeenCalled();
      expect(userStreakRepo.save).toHaveBeenCalled();
      expect(dailyChallengeRepo.increment).toHaveBeenCalledWith(
        { id: challengeId },
        'completionCount',
        1,
      );
    });

    it('should increment streak when completed on consecutive days', async () => {
      const challengeId = 'c2';
      const userId = 'u2';
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
        bonusXP: 50,
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
      completionRepo.save.mockResolvedValue({});
      dailyChallengeRepo.increment.mockResolvedValue({});

      const result = await service.completeDailyChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(4);
      expect(result.bonusPointsAwarded).toBe(15); // 0.05 * 3 = 0.15 * 100 = 15
      expect(result.bonusXPAwarded).toBe(50);
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
        bonusXP: 50,
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
      completionRepo.save.mockResolvedValue({});
      dailyChallengeRepo.increment.mockResolvedValue({});

      const result = await service.completeDailyChallenge(userId, challengeId, {
        score: 100,
        timeSpent: 60,
      });

      expect(result.currentStreak).toBe(1);
      expect(result.bonusPointsAwarded).toBe(0);
      expect(result.bonusXPAwarded).toBe(50);
      expect(userStreakRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStreak: 1,
        }),
      );
    });
  });

  describe('bonus XP claiming (idempotency)', () => {
    it('should claim bonus XP once', async () => {
      const completionId = 'comp1';
      const userId = 'u1';
      const completion = {
        id: completionId,
        userId,
        bonusXPAwarded: 50,
        bonusXPClaimed: false,
        dailyChallenge: { id: 'challenge1' },
      };

      completionRepo.findOne.mockResolvedValue(completion);
      completionRepo.save.mockResolvedValue({ ...completion, bonusXPClaimed: true });

      const result = await service.claimBonusXP(userId, completionId);

      expect(result.success).toBe(true);
      expect(result.bonusXPAwarded).toBe(50);
      expect(completionRepo.save).toHaveBeenCalled();
    });

    it('should prevent claiming bonus XP twice', async () => {
      const completionId = 'comp1';
      const userId = 'u1';
      const completion = {
        id: completionId,
        userId,
        bonusXPAwarded: 50,
        bonusXPClaimed: true,
      };

      completionRepo.findOne.mockResolvedValue(completion);

      await expect(service.claimBonusXP(userId, completionId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('weekly challenges', () => {
    it('should complete a weekly puzzle', async () => {
      const weeklyChallengeId = 'w1';
      const puzzleId = 'p1';
      const userId = 'u1';

      const weeklyChallenge = {
        id: weeklyChallengeId,
        weekStart: new Date(),
        puzzles: [{ id: puzzleId }],
        puzzleIds: [puzzleId],
        bonusXP: 250,
        isActive: true,
      };

      const newCompletion = {
        userId,
        weeklyChallengeId,
        completedPuzzleIds: [ puzzleId],
        allPuzzlesCompleted: true,
        bonusXPAwarded: 250,
        completedAt: new Date(),
      };

      weeklyChallengeRepo.findOne.mockResolvedValue(weeklyChallenge);
      weeklyCompletionRepo.findOne.mockResolvedValue(null);
      weeklyCompletionRepo.create.mockReturnValue(newCompletion);
      weeklyCompletionRepo.save.mockResolvedValue(newCompletion);
      weeklyChallengeRepo.increment.mockResolvedValue({});

      const result = await service.completeWeeklyPuzzle(userId, weeklyChallengeId, puzzleId);

      expect(result.success).toBe(true);
      expect(result.completedPuzzleIds).toContain(puzzleId);
      expect(result.allPuzzlesCompleted).toBe(true);
      expect(result.bonusXPAwarded).toBe(250);
      expect(weeklyChallengeRepo.increment).toHaveBeenCalledWith(
        { id: weeklyChallengeId },
        'completionCount',
        1,
      );
    });

    it('should prevent duplicate weekly puzzle completion', async () => {
      const weeklyChallengeId = 'w1';
      const puzzleId = 'p1';
      const userId = 'u1';

      const weeklyChallenge = {
        id: weeklyChallengeId,
        puzzleIds: [puzzleId],
        isActive: true,
      };

      const existingCompletion = {
        userId,
        completedPuzzleIds: [puzzleId],
      };

      weeklyChallengeRepo.findOne.mockResolvedValue(weeklyChallenge);
      weeklyCompletionRepo.findOne.mockResolvedValue(existingCompletion);

      await expect(service.completeWeeklyPuzzle(userId, weeklyChallengeId, puzzleId))
        .rejects.toThrow(BadRequestException);
    });

    it('should prevent completing non-existent weekly challenge', async () => {
      weeklyChallengeRepo.findOne.mockResolvedValue(null);

      await expect(service.completeWeeklyPuzzle('u1', 'w1', 'p1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('challenge history', () => {
    it('should retrieve daily challenge history', async () => {
      const userId = 'u1';
      const mockHistory = [
        {
          id: 'comp1',
          score: 95,
          completedAt: new Date(),
        },
      ];

      completionRepo.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory(userId, 30, 'daily');

      expect(result).toEqual(mockHistory);
      expect(completionRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['dailyChallenge', 'dailyChallenge.puzzle'],
        order: { completedAt: 'DESC' },
        take: 30,
      });
    });

    it('should retrieve weekly challenge history', async () => {
      const userId = 'u1';
      const mockHistory = [
        {
          id: 'wcomp1',
          allPuzzlesCompleted: true,
          completedAt: new Date(),
        },
      ];

      weeklyCompletionRepo.find.mockResolvedValue(mockHistory);

      const result = await service.getHistory(userId, 30, 'weekly');

      expect(result).toEqual(mockHistory);
      expect(weeklyCompletionRepo.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['weeklyChallenge', 'weeklyChallenge.puzzles'],
        order: { completedAt: 'DESC' },
        take: 30,
      });
    });
  });

  describe('invalid challenge handling', () => {
    it('should throw when completing inactive daily challenge', async () => {
      dailyChallengeRepo.findOne.mockResolvedValue(null);

      await expect(service.completeDailyChallenge('u1', 'c1', { score: 95, timeSpent: 60 }))
        .rejects.toThrow(NotFoundException);
    });

    it('should prevent completing challenge twice', async () => {
      const challengeId = 'c1';
      const userId = 'u1';

      dailyChallengeRepo.findOne.mockResolvedValue({
        id: challengeId,
        isActive: true,
        baseRewardPoints: 100,
        bonusXP: 50,
      });

      completionRepo.findOne.mockResolvedValue({
        id: 'existing',
        userId,
      });

      await expect(service.completeDailyChallenge(userId, challengeId, { score: 95, timeSpent: 60 }))
        .rejects.toThrow(BadRequestException);
    });
  });
});

