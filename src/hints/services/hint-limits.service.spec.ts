import { ForbiddenException } from '@nestjs/common';
import { HintLimitsService } from './hint-limits.service';

describe('HintLimitsService', () => {
  let usageRepo: any;
  let service: HintLimitsService;

  beforeEach(() => {
    usageRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
    };
    service = new HintLimitsService(usageRepo);
  });

  it('allows the first request and reports the remaining allowance', async () => {
    const status = await service.getStatus('user-1', 'puzzle-1');

    expect(status.allowed).toBe(true);
    expect(status.remainingForPuzzle).toBe(service.config.maxHintsPerPuzzle);
    expect(status.remainingToday).toBe(service.config.maxHintsPerDay);
  });

  it('blocks once the per-puzzle cap is reached', async () => {
    usageRepo.count.mockResolvedValue(service.config.maxHintsPerPuzzle);

    const status = await service.getStatus('user-1', 'puzzle-1');

    expect(status.allowed).toBe(false);
    expect(status.reason).toMatch(/puzzle/i);
    expect(status.remainingForPuzzle).toBe(0);
  });

  it('blocks once the daily cap is reached', async () => {
    usageRepo.find.mockResolvedValue(
      Array.from({ length: service.config.maxHintsPerDay }, () => ({
        cost: 0,
        createdAt: new Date(Date.now() - 60_000),
      })),
    );

    const status = await service.getStatus('user-1', 'puzzle-1');

    expect(status.allowed).toBe(false);
    expect(status.reason).toMatch(/daily/i);
    expect(status.remainingToday).toBe(0);
  });

  it('enforces the cooldown between requests', async () => {
    usageRepo.find.mockResolvedValue([
      { cost: 0, createdAt: new Date() },
    ]);

    const status = await service.getStatus('user-1', 'puzzle-1');

    expect(status.allowed).toBe(false);
    expect(status.cooldownRemainingMs).toBeGreaterThan(0);
    expect(status.nextAllowedAt).toBeInstanceOf(Date);
  });

  it('enforces the daily cost budget', async () => {
    usageRepo.find.mockResolvedValue([
      {
        cost: service.config.dailyCostBudget,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ]);

    const status = await service.getStatus('user-1', 'puzzle-1', 10);

    expect(status.allowed).toBe(false);
    expect(status.reason).toMatch(/budget/i);
    expect(status.remainingCostBudget).toBe(0);
  });

  it('reports cost already spent today', async () => {
    usageRepo.find.mockResolvedValue([
      { cost: 5, createdAt: new Date(Date.now() - 60_000) },
      { cost: 7, createdAt: new Date(Date.now() - 120_000) },
    ]);

    const status = await service.getStatus('user-1', 'puzzle-1');

    expect(status.costSpentToday).toBe(12);
    expect(status.remainingCostBudget).toBe(
      service.config.dailyCostBudget - 12,
    );
  });

  it('throws a ForbiddenException from assertAllowed when blocked', async () => {
    usageRepo.count.mockResolvedValue(service.config.maxHintsPerPuzzle);

    await expect(
      service.assertAllowed('user-1', 'puzzle-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the status from assertAllowed when within limits', async () => {
    const status = await service.assertAllowed('user-1', 'puzzle-1', 0);
    expect(status.allowed).toBe(true);
  });
});
