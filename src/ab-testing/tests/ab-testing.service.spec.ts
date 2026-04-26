import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { ExperimentsService } from '../experiments.service';
import { Experiment, ExperimentStatus } from '../entities/experiment.entity';
import { ExperimentConversion } from '../entities/experiment-conversion.entity';
import { FeatureFlag, TargetCohort } from '../entities/feature-flag.entity';
import { ExperimentAssignment } from '../entities/experiment-assignment.entity';

// ─── Shared fixtures ────────────────────────────────────────────────────────

const mockExperiment: Experiment = {
  id: 'exp-uuid-1',
  name: 'Test Experiment',
  variants: [{ name: 'control' }, { name: 'variant_a' }],
  traffic_split_pct: 100,
  status: ExperimentStatus.RUNNING,
  started_at: new Date('2024-01-01'),
  ended_at: null,
};

const mockFlag: FeatureFlag = {
  id: 'flag-uuid-1',
  key: 'new_puzzle_ui',
  enabled: true,
  rollout_pct: 50,
  target_cohort: TargetCohort.ALL,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRepos(overrides: {
  experimentFind?: jest.Mock;
  experimentFindOne?: jest.Mock;
  conversionFind?: jest.Mock;
  flagFindOne?: jest.Mock;
  assignmentFindOne?: jest.Mock;
} = {}) {
  return {
    experimentRepo: {
      find: overrides.experimentFind ?? jest.fn().mockResolvedValue([mockExperiment]),
      findOne: overrides.experimentFindOne ?? jest.fn().mockResolvedValue(mockExperiment),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((e) => Promise.resolve({ ...e, id: 'new-uuid' })),
    },
    conversionRepo: {
      find: overrides.conversionFind ?? jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((c) => Promise.resolve({ ...c, id: 'conv-uuid' })),
    },
    flagRepo: {
      find: jest.fn().mockResolvedValue([mockFlag]),
      findOne: overrides.flagFindOne ?? jest.fn().mockResolvedValue(mockFlag),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((f) => Promise.resolve(f)),
    },
    assignmentRepo: {
      findOne: overrides.assignmentFindOne ?? jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((a) => Promise.resolve(a)),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    },
  };
}

async function buildService(overrides = {}): Promise<ExperimentsService> {
  const repos = makeRepos(overrides);

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ExperimentsService,
      { provide: getRepositoryToken(Experiment), useValue: repos.experimentRepo },
      { provide: getRepositoryToken(ExperimentConversion), useValue: repos.conversionRepo },
      { provide: getRepositoryToken(FeatureFlag), useValue: repos.flagRepo },
      { provide: getRepositoryToken(ExperimentAssignment), useValue: repos.assignmentRepo },
    ],
  }).compile();

  return module.get(ExperimentsService);
}

// ─── Test suites ────────────────────────────────────────────────────────────

describe('ExperimentsService — variant assignment', () => {
  it('assigns the same variant on repeat calls for the same user', async () => {
    const svc = await buildService();
    const first = await svc.assignVariant('user-stable-123');
    const second = await svc.assignVariant('user-stable-123');
    expect(first?.variantName).toBe(second?.variantName);
  });

  it('assigns different variants across users (distribution check)', async () => {
    const svc = await buildService();
    const results = await Promise.all(
      Array.from({ length: 50 }, (_, i) => svc.assignVariant(`user-${i}`)),
    );
    const variants = new Set(results.map((r) => r?.variantName));
    // With 50 users and 2 variants we expect both to appear
    expect(variants.size).toBe(2);
  });

  it('returns null when no experiments are running', async () => {
    const svc = await buildService({
      experimentFind: jest.fn().mockResolvedValue([]),
    });
    const result = await svc.assignVariant('user-abc');
    expect(result).toBeNull();
  });

  it('returns null for users outside the traffic split', async () => {
    const lowTraffic: Experiment = { ...mockExperiment, traffic_split_pct: 0 };
    const svc = await buildService({
      experimentFind: jest.fn().mockResolvedValue([lowTraffic]),
    });
    const result = await svc.assignVariant('user-abc');
    expect(result).toBeNull();
  });
});

describe('ExperimentsService — conversion tracking', () => {
  it('saves a conversion for the assigned variant', async () => {
    const svc = await buildService();
    const conversion = await svc.trackConversion('exp-uuid-1', {
      user_id: 'user-stable-123',
      event_type: 'puzzle_completed',
    });
    expect(conversion).toHaveProperty('experiment_id', 'exp-uuid-1');
    expect(conversion).toHaveProperty('event_type', 'puzzle_completed');
  });

  it('throws NotFoundException when experiment does not exist', async () => {
    const svc = await buildService({
      experimentFindOne: jest.fn().mockResolvedValue(null),
    });
    await expect(
      svc.trackConversion('bad-id', { user_id: 'u', event_type: 'e' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('ExperimentsService — result aggregation', () => {
  it('returns zero conversion rate when there are no conversions', async () => {
    const svc = await buildService({
      conversionFind: jest.fn().mockResolvedValue([]),
    });
    const results = await svc.getResults('exp-uuid-1');
    for (const r of results.results) {
      expect(r.conversion_rate).toBe(0);
    }
  });

  it('calculates conversion rate correctly', async () => {
    const conversions: Partial<ExperimentConversion>[] = [
      { experiment_id: 'exp-uuid-1', user_id: 'u1', variant_name: 'control', event_type: 'done' },
      { experiment_id: 'exp-uuid-1', user_id: 'u1', variant_name: 'control', event_type: 'done' },
      { experiment_id: 'exp-uuid-1', user_id: 'u2', variant_name: 'variant_a', event_type: 'done' },
    ];
    const svc = await buildService({
      conversionFind: jest.fn().mockResolvedValue(conversions),
    });
    const { results } = await svc.getResults('exp-uuid-1');
    const control = results.find((r) => r.variant === 'control');
    // u1 converted twice but is only 1 unique user
    expect(control?.total_users).toBe(1);
    expect(control?.conversions).toBe(2);
  });

  it('includes statistical significance in the response', async () => {
    const svc = await buildService();
    const { significance } = await svc.getResults('exp-uuid-1');
    expect(significance).toHaveProperty('z_score');
    expect(significance).toHaveProperty('significant');
  });
});

describe('ExperimentsService — feature flag evaluation', () => {
  const premiumPlayer = { userId: 'p1', isPremium: true, accountAgeDays: 100 };
  const newPlayer = { userId: 'p2', isPremium: false, accountAgeDays: 3 };
  const regularPlayer = { userId: 'p3', isPremium: false, accountAgeDays: 30 };

  it('returns false when flag is disabled', async () => {
    const disabledFlag: FeatureFlag = { ...mockFlag, enabled: false };
    const svc = await buildService({
      flagFindOne: jest.fn().mockResolvedValue(disabledFlag),
    });
    expect(await svc.evaluateFlag('new_puzzle_ui', regularPlayer)).toBe(false);
  });

  it('returns false when flag does not exist', async () => {
    const svc = await buildService({
      flagFindOne: jest.fn().mockResolvedValue(null),
    });
    expect(await svc.evaluateFlag('nonexistent', regularPlayer)).toBe(false);
  });

  it('respects PREMIUM cohort — non-premium player is excluded', async () => {
    const premiumFlag: FeatureFlag = {
      ...mockFlag,
      rollout_pct: 100,
      target_cohort: TargetCohort.PREMIUM,
    };
    const svc = await buildService({
      flagFindOne: jest.fn().mockResolvedValue(premiumFlag),
    });
    expect(await svc.evaluateFlag('new_puzzle_ui', regularPlayer)).toBe(false);
    expect(await svc.evaluateFlag('new_puzzle_ui', premiumPlayer)).toBe(true);
  });

  it('respects NEW_USERS cohort', async () => {
    const newUserFlag: FeatureFlag = {
      ...mockFlag,
      rollout_pct: 100,
      target_cohort: TargetCohort.NEW_USERS,
    };
    const svc = await buildService({
      flagFindOne: jest.fn().mockResolvedValue(newUserFlag),
    });
    expect(await svc.evaluateFlag('flag', newPlayer)).toBe(true);
    expect(await svc.evaluateFlag('flag', regularPlayer)).toBe(false);
  });

  it('same user always gets the same result (deterministic rollout)', async () => {
    const svc = await buildService();
    const r1 = await svc.evaluateFlag('new_puzzle_ui', regularPlayer);
    const r2 = await svc.evaluateFlag('new_puzzle_ui', regularPlayer);
    expect(r1).toBe(r2);
  });
});

describe('ExperimentsService — flag management', () => {
  it('creates a new flag with default values', async () => {
    const svc = await buildService();
    const flag = await svc.createFlag({
      key: 'new_feature',
    });
    expect(flag).toHaveProperty('key', 'new_feature');
    expect(flag).toHaveProperty('enabled', false);
    expect(flag).toHaveProperty('rollout_pct', 100);
    expect(flag).toHaveProperty('target_cohort', TargetCohort.ALL);
  });

  it('updates an existing flag', async () => {
    const svc = await buildService();
    const updated = await svc.updateFlag('new_puzzle_ui', {
      enabled: false,
      rollout_pct: 25,
    });
    expect(updated).toHaveProperty('enabled', false);
    expect(updated).toHaveProperty('rollout_pct', 25);
  });

  it('throws NotFoundException when updating non-existent flag', async () => {
    const svc = await buildService({
      flagFindOne: jest.fn().mockResolvedValue(null),
    });
    await expect(
      svc.updateFlag('nonexistent', { enabled: true }),
    ).rejects.toThrow(NotFoundException);
  });
});