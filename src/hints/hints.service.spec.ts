import { ForbiddenException } from '@nestjs/common';
import { HintsService } from './hints.service';
import { HintCostService } from './services/hint-cost.service';
import { HintCacheService } from './services/hint-cache.service';

function makeHint(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? 'hint-1',
    puzzleId: 'puzzle-1',
    order: overrides.order ?? 1,
    type: overrides.type ?? 'general',
    content: overrides.content ?? 'Look at the corners',
    cost: 0,
    pointsPenalty: 0,
    skillLevelTarget: {},
    isActive: true,
    effectiveness: 0.5,
    usageCount: 0,
    successCount: 0,
    analytics: {},
    ...overrides,
  };
}

function makeRequest(overrides: Record<string, any> = {}) {
  return {
    userId: 'user-1',
    puzzleId: 'puzzle-1',
    attemptNumber: 1,
    timeSpent: 30,
    playerState: { skillLevel: 3 },
    puzzleState: { difficulty: 'medium', progress: 0 },
    ...overrides,
  } as any;
}

describe('HintsService', () => {
  let hintRepo: any;
  let usageRepo: any;
  let templateRepo: any;
  let playerEvents: any;
  let limits: any;
  let analytics: any;
  let service: HintsService;

  beforeEach(() => {
    hintRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'generated-hint', ...value })),
      update: jest.fn().mockResolvedValue({}),
    };
    usageRepo = {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: 'usage-1', ...value })),
      find: jest.fn().mockResolvedValue([]),
    };
    templateRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    playerEvents = {
      emitPlayerEvent: jest.fn().mockResolvedValue({}),
    };
    limits = {
      getStatus: jest.fn().mockResolvedValue({ allowed: true }),
      assertAllowed: jest.fn().mockResolvedValue({ allowed: true }),
    };
    analytics = {
      getPuzzleAnalytics: jest.fn(),
      getUserAnalytics: jest.fn(),
      getGlobalAnalytics: jest.fn(),
    };

    service = new HintsService(
      hintRepo,
      usageRepo,
      templateRepo,
      playerEvents,
      new HintCostService(),
      new HintCacheService(),
      limits,
      analytics,
    );
  });

  it('returns the first progressive hint and records it as free', async () => {
    hintRepo.find.mockResolvedValue([
      makeHint({ id: 'h1', order: 1 }),
      makeHint({ id: 'h2', order: 2 }),
      makeHint({ id: 'h3', order: 3 }),
    ]);

    const result = await service.requestHint(makeRequest());

    expect(result.id).toBe('h1');
    expect(usageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        hintId: 'h1',
        hintOrder: 1,
        cost: 0,
      }),
    );
  });

  it('advances to the next tier after prior usage', async () => {
    usageRepo.count.mockResolvedValue(1);
    hintRepo.find.mockResolvedValue([
      makeHint({ id: 'h1', order: 1 }),
      makeHint({ id: 'h2', order: 2 }),
      makeHint({ id: 'h3', order: 3 }),
    ]);

    const result = await service.requestHint(makeRequest());

    expect(result.id).toBe('h2');
    // order 2 at medium difficulty: 5 * 1.5 * 1.5 = 11.25 -> 11
    expect(usageRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ hintId: 'h2', cost: 11 }),
    );
  });

  it('checks fairness limits before recording usage', async () => {
    hintRepo.find.mockResolvedValue([makeHint({ id: 'h1', order: 1 })]);
    limits.assertAllowed.mockRejectedValue(
      new ForbiddenException('Hint limit reached for this puzzle'),
    );

    await expect(service.requestHint(makeRequest())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(usageRepo.save).not.toHaveBeenCalled();
  });

  it('serves repeated identical requests from the cache', async () => {
    hintRepo.find.mockResolvedValue([makeHint({ id: 'h1', order: 1 })]);

    await service.requestHint(makeRequest());
    await service.requestHint(makeRequest());

    expect(hintRepo.find).toHaveBeenCalledTimes(1);
    expect(usageRepo.save).toHaveBeenCalledTimes(2);
  });

  it('clears cached hints when a template changes', async () => {
    hintRepo.find.mockResolvedValue([makeHint({ id: 'h1', order: 1 })]);
    templateRepo.findOne.mockResolvedValue({ id: 'template-1', name: 'T' });
    templateRepo.save.mockResolvedValue({ id: 'template-1', name: 'T' });

    await service.requestHint(makeRequest());
    await service.updateTemplate('template-1', { content: 'new content' });
    await service.requestHint(makeRequest());

    expect(hintRepo.find).toHaveBeenCalledTimes(2);
  });

  it('derives cost server-side when recording hint feedback', async () => {
    hintRepo.findOne.mockResolvedValue(makeHint({ id: 'h1', order: 2 }));

    const usage = await service.recordUsage({
      hintId: 'h1',
      puzzleId: 'puzzle-1',
      userId: 'user-1',
      attemptNumber: 1,
      timeSpent: 30,
      ledToCompletion: true,
      satisfactionRating: 5,
      cost: 9999,
    } as any);

    expect(usage).toBeDefined();
    expect(usageRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ hintOrder: 2, cost: 0 }),
    );
    expect(hintRepo.update).toHaveBeenCalledWith(
      'h1',
      expect.objectContaining({ successCount: 1 }),
    );
  });

  it('emits an audit event for each hint request', async () => {
    hintRepo.find.mockResolvedValue([makeHint({ id: 'h1', order: 1 })]);

    await service.requestHint(makeRequest());

    expect(playerEvents.emitPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'hint.used' }),
    );
  });

  it('previews the cost schedule', () => {
    const preview = service.getCostPreview('puzzle-1', 2, 'hard', 3);

    expect(preview.next.totalCost).toBe(15);
    expect(preview.schedule).toHaveLength(3);
  });

  it('delegates limit and analytics queries', async () => {
    limits.getStatus.mockResolvedValue({ allowed: true, usedToday: 1 });
    analytics.getPuzzleAnalytics.mockResolvedValue({ puzzleId: 'puzzle-1' });
    analytics.getUserAnalytics.mockResolvedValue({ userId: 'user-1' });
    analytics.getGlobalAnalytics.mockResolvedValue({ totalHints: 2 });

    await expect(
      service.getLimitsStatus('user-1', 'puzzle-1'),
    ).resolves.toEqual({ allowed: true, usedToday: 1 });
    await expect(service.getPuzzleAnalytics('puzzle-1')).resolves.toEqual({
      puzzleId: 'puzzle-1',
    });
    await expect(service.getUserAnalytics('user-1')).resolves.toEqual({
      userId: 'user-1',
    });
    await expect(service.getGlobalAnalytics()).resolves.toEqual({
      totalHints: 2,
    });
  });
});
