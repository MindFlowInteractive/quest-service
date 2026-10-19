import { HintAnalyticsService } from './hint-analytics.service';

describe('HintAnalyticsService', () => {
  let hintRepo: any;
  let usageRepo: any;
  let service: HintAnalyticsService;

  beforeEach(() => {
    hintRepo = {
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };
    usageRepo = { find: jest.fn().mockResolvedValue([]) };
    service = new HintAnalyticsService(hintRepo, usageRepo);
  });

  it('aggregates puzzle analytics and grades each hint', async () => {
    hintRepo.find.mockResolvedValue([
      { id: 'h1', order: 1, type: 'general', effectiveness: 0.9 },
      { id: 'h2', order: 2, type: 'specific', effectiveness: 0.1 },
      { id: 'h3', order: 3, type: 'strategic', effectiveness: 0 },
    ]);
    usageRepo.find.mockResolvedValue([
      {
        hintId: 'h1',
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        ledToCompletion: true,
        satisfactionRating: 5,
        timeToCompletion: 10,
        cost: 0,
        isAbuseAttempt: false,
      },
      {
        hintId: 'h1',
        userId: 'user-2',
        puzzleId: 'puzzle-1',
        ledToCompletion: true,
        satisfactionRating: 4,
        timeToCompletion: 20,
        cost: 8,
        isAbuseAttempt: false,
      },
      {
        hintId: 'h2',
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        ledToCompletion: false,
        satisfactionRating: 2,
        timeToCompletion: 30,
        cost: 11,
        isAbuseAttempt: true,
      },
    ]);

    const result = await service.getPuzzleAnalytics('puzzle-1');

    expect(result.totalRequests).toBe(3);
    expect(result.uniqueUsers).toBe(2);
    expect(result.completionsLed).toBe(2);
    expect(result.abuseAttempts).toBe(1);
    expect(result.totalCostCharged).toBe(19);
    expect(result.averageSatisfaction).toBeCloseTo(11 / 3);
    expect(result.averageTimeToCompletion).toBe(20);

    const first = result.hints.find((row) => row.hintId === 'h1');
    expect(first.usageCount).toBe(2);
    expect(first.successCount).toBe(2);
    expect(first.completionRate).toBe(1);
    expect(first.grade).toBe('excellent');

    const unused = result.hints.find((row) => row.hintId === 'h3');
    expect(unused.grade).toBe('unrated');
  });

  it('aggregates per-user analytics', async () => {
    usageRepo.find.mockResolvedValue([
      {
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        ledToCompletion: true,
        satisfactionRating: 5,
        cost: 8,
        createdAt: new Date('2026-10-18T10:00:00Z'),
      },
      {
        userId: 'user-1',
        puzzleId: 'puzzle-2',
        ledToCompletion: false,
        satisfactionRating: 3,
        cost: 11,
        createdAt: new Date('2026-10-17T10:00:00Z'),
      },
    ]);

    const result = await service.getUserAnalytics('user-1');

    expect(result.totalHintsUsed).toBe(2);
    expect(result.puzzlesTouched).toBe(2);
    expect(result.completionsHelped).toBe(1);
    expect(result.totalCostSpent).toBe(19);
    expect(result.averageSatisfaction).toBe(4);
    expect(result.lastUsedAt).toEqual(new Date('2026-10-18T10:00:00Z'));
  });

  it('aggregates global analytics', async () => {
    hintRepo.count.mockResolvedValue(12);
    usageRepo.find.mockResolvedValue([
      {
        userId: 'user-1',
        ledToCompletion: true,
        cost: 5,
        isAbuseAttempt: false,
      },
      {
        userId: 'user-2',
        ledToCompletion: false,
        cost: 0,
        isAbuseAttempt: true,
      },
    ]);

    const result = await service.getGlobalAnalytics();

    expect(result.totalHints).toBe(12);
    expect(result.totalRequests).toBe(2);
    expect(result.uniqueUsers).toBe(2);
    expect(result.completionRate).toBe(0.5);
    expect(result.abuseAttempts).toBe(1);
    expect(result.totalCostCharged).toBe(5);
  });

  it('returns null averages when there is no data', async () => {
    const result = await service.getPuzzleAnalytics('puzzle-1');

    expect(result.totalRequests).toBe(0);
    expect(result.averageSatisfaction).toBeNull();
    expect(result.averageTimeToCompletion).toBeNull();
  });
});
