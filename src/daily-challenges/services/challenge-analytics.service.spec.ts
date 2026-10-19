import { NotFoundException } from '@nestjs/common';
import { ChallengeAnalyticsService } from './challenge-analytics.service';

describe('ChallengeAnalyticsService', () => {
  let dailyChallengeRepo: any;
  let completionRepo: any;
  let weeklyChallengeRepo: any;
  let weeklyCompletionRepo: any;
  let userStreakRepo: any;
  let service: ChallengeAnalyticsService;

  beforeEach(() => {
    dailyChallengeRepo = { findOne: jest.fn(), find: jest.fn() };
    completionRepo = { find: jest.fn() };
    weeklyChallengeRepo = { find: jest.fn() };
    weeklyCompletionRepo = { find: jest.fn() };
    userStreakRepo = { find: jest.fn() };

    service = new ChallengeAnalyticsService(
      dailyChallengeRepo,
      completionRepo,
      weeklyChallengeRepo,
      weeklyCompletionRepo,
      userStreakRepo,
    );
  });

  describe('getChallengeAnalytics', () => {
    it('aggregates participation, scores and streaks', async () => {
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: 'challenge-1',
        puzzleId: 'puzzle-1',
        challengeDate: '2026-10-18',
        completionCount: 2,
      });
      completionRepo.find.mockResolvedValue([
        {
          userId: 'user-1',
          score: 100,
          timeSpent: 60,
          streakBonusAwarded: 10,
          bonusXPAwarded: 50,
          bonusXPClaimed: true,
          completedAt: new Date(),
        },
        {
          userId: 'user-2',
          score: 80,
          timeSpent: 120,
          streakBonusAwarded: 0,
          bonusXPAwarded: 50,
          bonusXPClaimed: false,
          completedAt: new Date(),
        },
      ]);

      const result = await service.getChallengeAnalytics('challenge-1');

      expect(result.uniquePlayers).toBe(2);
      expect(result.completionCount).toBe(2);
      expect(result.averageScore).toBe(90);
      expect(result.averageTimeSpent).toBe(90);
      expect(result.averageStreakBonus).toBe(5);
      expect(result.totalStreakBonus).toBe(10);
      expect(result.claimedBonusXP).toBe(1);
      expect(result.claimRate).toBe(0.5);
      expect(result.scoreBuckets['100+']).toBe(1);
      expect(result.scoreBuckets['75-89']).toBe(1);
      expect(result.challengeDate).toBe('2026-10-18');
    });

    it('handles a challenge with no completions', async () => {
      dailyChallengeRepo.findOne.mockResolvedValue({
        id: 'challenge-1',
        puzzleId: 'puzzle-1',
        challengeDate: '2026-10-18',
        completionCount: 0,
      });
      completionRepo.find.mockResolvedValue([]);

      const result = await service.getChallengeAnalytics('challenge-1');

      expect(result.uniquePlayers).toBe(0);
      expect(result.averageScore).toBeNull();
      expect(result.claimRate).toBe(0);
    });

    it('throws when the challenge does not exist', async () => {
      dailyChallengeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getChallengeAnalytics('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getParticipationOverview', () => {
    it('returns a zero-filled series when there is no activity', async () => {
      dailyChallengeRepo.find.mockResolvedValue([]);
      completionRepo.find.mockResolvedValue([]);

      const overview = await service.getParticipationOverview(3);

      expect(overview.days).toBe(3);
      expect(overview.series).toHaveLength(3);
      expect(overview.totalCompletions).toBe(0);
      expect(overview.bestDay).toBeNull();
    });

    it('counts raw completion rows per day', async () => {
      const now = new Date();
      dailyChallengeRepo.find.mockResolvedValue([
        { id: 'challenge-1', challengeDate: now, completionCount: 0 },
      ]);
      completionRepo.find.mockResolvedValue([
        { userId: 'user-1', completedAt: now, score: 100, timeSpent: 50 },
        { userId: 'user-2', completedAt: now, score: 60, timeSpent: 150 },
      ]);

      const overview = await service.getParticipationOverview(1);

      expect(overview.totalCompletions).toBe(2);
      expect(overview.uniquePlayers).toBe(2);
      expect(overview.bestDay).not.toBeNull();
      expect(overview.bestDay?.completions).toBe(2);
      expect(overview.series[0].averageScore).toBe(80);
    });

    it('clamps the requested day range', async () => {
      dailyChallengeRepo.find.mockResolvedValue([]);
      completionRepo.find.mockResolvedValue([]);

      const overview = await service.getParticipationOverview(1000);

      expect(overview.days).toBe(90);
      expect(overview.series).toHaveLength(90);
    });
  });

  describe('getStreakDistribution', () => {
    it('buckets current streaks', async () => {
      userStreakRepo.find.mockResolvedValue([
        { currentStreak: 0 },
        { currentStreak: 2 },
        { currentStreak: 7 },
        { currentStreak: 150 },
      ]);

      const distribution = await service.getStreakDistribution();

      expect(distribution.totalTracked).toBe(4);
      expect(
        distribution.buckets.find((bucket) => bucket.label === '0')?.count,
      ).toBe(1);
      expect(
        distribution.buckets.find((bucket) => bucket.label === '1-2')?.count,
      ).toBe(1);
      expect(
        distribution.buckets.find((bucket) => bucket.label === '7-13')?.count,
      ).toBe(1);
      expect(
        distribution.buckets.find((bucket) => bucket.label === '100+')?.count,
      ).toBe(1);
    });
  });

  describe('getWeeklyOverview', () => {
    it('summarises weekly challenge participation', async () => {
      weeklyChallengeRepo.find.mockResolvedValue([
        {
          id: 'weekly-1',
          weekStart: new Date('2026-10-12'),
          completionCount: 0,
        },
      ]);
      weeklyCompletionRepo.find.mockResolvedValue([
        {
          weeklyChallengeId: 'weekly-1',
          userId: 'user-1',
          allPuzzlesCompleted: true,
          bonusXPAwarded: 250,
        },
        {
          weeklyChallengeId: 'weekly-1',
          userId: 'user-2',
          allPuzzlesCompleted: false,
          bonusXPAwarded: 0,
        },
      ]);

      const overview = await service.getWeeklyOverview();

      expect(overview.challenges).toHaveLength(1);
      expect(overview.challenges[0].uniquePlayers).toBe(2);
      expect(overview.challenges[0].fullyCompleted).toBe(1);
      expect(overview.challenges[0].bonusXPAwarded).toBe(250);
    });
  });
});
