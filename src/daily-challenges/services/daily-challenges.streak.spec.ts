import { BadRequestException } from '@nestjs/common';
import { DailyChallengesService } from './daily-challenges.service';

describe('DailyChallengesService - streaks and grace periods', () => {
  let dailyChallengeRepo: any;
  let completionRepo: any;
  let weeklyChallengeRepo: any;
  let weeklyCompletionRepo: any;
  let userStreakRepo: any;
  let userRepo: any;
  let service: DailyChallengesService;

  beforeEach(() => {
    dailyChallengeRepo = { findOne: jest.fn(), increment: jest.fn() };
    completionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    weeklyChallengeRepo = { findOne: jest.fn(), find: jest.fn(), increment: jest.fn() };
    weeklyCompletionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    userStreakRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    userRepo = { findOne: jest.fn() };

    service = new DailyChallengesService(
      dailyChallengeRepo,
      completionRepo,
      weeklyChallengeRepo,
      weeklyCompletionRepo,
      userStreakRepo,
      userRepo,
    );
  });

  describe('computeStreakBonus', () => {
    it('awards nothing on the first day', () => {
      const bonus = service.computeStreakBonus(100, 1);
      expect(bonus.multiplier).toBe(0);
      expect(bonus.totalBonus).toBe(0);
    });

    it('adds 5% per consecutive day past the first', () => {
      const bonus = service.computeStreakBonus(100, 4);
      expect(bonus.multiplier).toBeCloseTo(0.15);
      expect(bonus.pointsBonus).toBe(15);
      expect(bonus.milestoneBonus).toBe(0);
      expect(bonus.totalBonus).toBe(15);
    });

    it('caps the percentage bonus at 50%', () => {
      const bonus = service.computeStreakBonus(100, 30);
      expect(bonus.multiplier).toBe(0.5);
      expect(bonus.pointsBonus).toBe(50);
    });

    it('adds milestone bonuses at 7, 14, 30 and 100 days', () => {
      expect(service.computeStreakBonus(100, 7).milestoneBonus).toBe(50);
      expect(service.computeStreakBonus(100, 14).milestoneBonus).toBe(100);
      expect(service.computeStreakBonus(100, 30).milestoneBonus).toBe(250);
      expect(service.computeStreakBonus(100, 100).milestoneBonus).toBe(1000);
    });

    it('combines the percentage and milestone bonuses', () => {
      const bonus = service.computeStreakBonus(100, 7);
      expect(bonus.pointsBonus).toBe(30);
      expect(bonus.totalBonus).toBe(80);
    });
  });

  describe('getStreakStatus', () => {
    it('returns an empty status when no streak exists', async () => {
      userStreakRepo.findOne.mockResolvedValue(null);

      const status = await service.getStreakStatus('user-1');

      expect(status.currentStreak).toBe(0);
      expect(status.completedToday).toBe(false);
      expect(status.atRisk).toBe(false);
      expect(status.gracePeriod.grantable).toBe(true);
    });

    it('marks the streak as safe once today is completed', async () => {
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 4,
        longestStreak: 6,
        lastPuzzleCompletedAt: new Date(),
        streakRecoveryGracePeriodEnd: null,
        gracePeriodsGranted: 1,
        gracePeriodsUsed: 0,
      });

      const status = await service.getStreakStatus('user-1');

      expect(status.completedToday).toBe(true);
      expect(status.atRisk).toBe(false);
      expect(status.longestStreak).toBe(6);
      expect(status.bonusMultiplier).toBeCloseTo(0.15);
      expect(status.nextMilestone).toEqual({
        days: 7,
        bonus: 50,
        daysRemaining: 3,
      });
    });

    it('marks the streak as at risk when today is not completed', async () => {
      const yesterday = new Date(Date.now() - 86_400_000);
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 4,
        lastPuzzleCompletedAt: yesterday,
        streakRecoveryGracePeriodEnd: null,
      });

      const status = await service.getStreakStatus('user-1');

      expect(status.completedToday).toBe(false);
      expect(status.atRisk).toBe(true);
    });

    it('reports an active grace period as non-grantable', async () => {
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 4,
        lastPuzzleCompletedAt: new Date(Date.now() - 86_400_000),
        streakRecoveryGracePeriodEnd: new Date(Date.now() + 3_600_000),
      });

      const status = await service.getStreakStatus('user-1');

      expect(status.gracePeriod.active).toBe(true);
      expect(status.gracePeriod.grantable).toBe(false);
      expect(status.gracePeriod.endsAt).toBeInstanceOf(Date);
    });
  });

  describe('grantGracePeriod', () => {
    it('opens a recovery window and records the grant', async () => {
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 5,
        streakRecoveryGracePeriodEnd: null,
        gracePeriodsGranted: 0,
      });

      const result = await service.grantGracePeriod('user-1', 48);

      expect(result.success).toBe(true);
      expect(result.hours).toBe(48);
      expect(result.gracePeriodsGranted).toBe(1);
      expect(result.gracePeriodEndsAt).toBeInstanceOf(Date);
      expect(userStreakRepo.save).toHaveBeenCalled();
    });

    it('clamps the window to one week', async () => {
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 5,
        streakRecoveryGracePeriodEnd: null,
        gracePeriodsGranted: 0,
      });

      const result = await service.grantGracePeriod('user-1', 999);
      expect(result.hours).toBe(168);
    });

    it('rejects a second grace period while one is active', async () => {
      userStreakRepo.findOne.mockResolvedValue({
        currentStreak: 5,
        streakRecoveryGracePeriodEnd: new Date(Date.now() + 3_600_000),
      });

      await expect(service.grantGracePeriod('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates a streak row for a brand new user', async () => {
      userStreakRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });

      const result = await service.grantGracePeriod('user-1', 24);

      expect(result.success).toBe(true);
      expect(userStreakRepo.create).toHaveBeenCalled();
      expect(userStreakRepo.save).toHaveBeenCalled();
    });

    it('throws when the user does not exist', async () => {
      userStreakRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.grantGracePeriod('missing')).rejects.toThrow(
        /User not found/,
      );
    });
  });

  describe('getStreakLeaderboard', () => {
    it('returns the top streaks ordered by length', async () => {
      userStreakRepo.find.mockResolvedValue([{ currentStreak: 9 }]);

      const rows = await service.getStreakLeaderboard(5);

      expect(rows).toHaveLength(1);
      expect(userStreakRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          order: { currentStreak: 'DESC', longestStreak: 'DESC' },
        }),
      );
    });

    it('clamps the requested limit', async () => {
      userStreakRepo.find.mockResolvedValue([]);

      await service.getStreakLeaderboard(500);

      expect(userStreakRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });
});
