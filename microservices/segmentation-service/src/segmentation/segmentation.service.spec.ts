import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SegmentationService } from './segmentation.service';
import { SegmentationRuleEngineService } from './segmentation-rule-engine.service';
import { RedisCacheService } from './redis-cache.service';
import { Segment } from './entities/segment.entity';
import { Rule } from './entities/rule.entity';
import { Membership } from './entities/membership.entity';
import { SegmentEvent } from './entities/segment-event.entity';
import { AbAssignment, AbExperiment } from './entities/ab-experiment.entity';
import {
  ExperimentStatus,
  RuleOperator,
  SegmentStatus,
  SegmentationType,
} from './interfaces/user-signal.interface';

interface InMemoryFindOptions {
  where?: Record<string, unknown>;
  relations?: Record<string, boolean>;
  select?: Record<string, boolean>;
  order?: Record<string, 'ASC' | 'DESC'>;
  take?: number;
}

class InMemoryRepo<T extends { id: string }> {
  rows: T[] = [];
  relationResolvers: Record<string, (entity: T) => unknown[]> = {};
  insertResult: { identifiers?: Array<Record<string, unknown>> } = {
    identifiers: [{ id: 'fresh-id' }],
  };

  create(data: Partial<T>): T {
    return {
      ...(data as T),
      id:
        (data as { id?: string }).id ??
        'id-' + Math.random().toString(36).slice(2),
    };
  }

  async save(entity: T | T[]): Promise<T | T[]> {
    const list = Array.isArray(entity) ? entity : [entity];
    for (const item of list) {
      if (!item.id) {
        item.id = 'id-' + Math.random().toString(36).slice(2);
      }
      const existing = this.rows.findIndex(
        (row) => row.id === (item as { id: string }).id,
      );
      if (existing >= 0) {
        this.rows[existing] = item;
      } else {
        this.rows.push(item);
      }
    }
    return Array.isArray(entity) ? entity : list[0];
  }
  async find(options: InMemoryFindOptions = {}): Promise<T[]> {
    const filtered = this.rows.filter((row) =>
      this.matchesWhere(row, options.where),
    );

    if (options.take) {
      // Mimic ORDER BY createdAt DESC if no explicit order is supplied.
      filtered.sort((a, b) => {
        const aTime =
          (
            a as unknown as { createdAt?: Date | string }
          ).createdAt?.toString() ?? '';
        const bTime =
          (
            b as unknown as { createdAt?: Date | string }
          ).createdAt?.toString() ?? '';
        return aTime < bTime ? 1 : -1;
      });
    }

    if (options.relations) {
      for (const entity of filtered) {
        for (const [key, enabled] of Object.entries(options.relations)) {
          if (!enabled) continue;
          const resolver = this.relationResolvers[key];
          if (resolver) {
            (entity as Record<string, unknown>)[key] = resolver(entity);
          }
        }
      }
    }

    const selected = options.take ? filtered.slice(0, options.take) : filtered;

    if (options.select) {
      return selected.map((entity) => {
        const projection: Partial<T> = {} as Partial<T>;
        for (const [key, enabled] of Object.entries(options.select ?? {})) {
          if (!enabled) continue;
          const value = (entity as Record<string, unknown>)[key];
          if (value !== undefined) {
            (projection as Record<string, unknown>)[key] = value;
          }
        }
        return projection as T;
      });
    }

    return selected;
  }

  async findOne(options: InMemoryFindOptions): Promise<T | null> {
    const results = await this.find(options);
    return results[0] ?? null;
  }

  async count(filter: InMemoryFindOptions = {}): Promise<number> {
    return this.rows.filter((row) => this.matchesWhere(row, filter.where))
      .length;
  }

  async remove(entity: T): Promise<T> {
    this.rows = this.rows.filter(
      (row) => row.id !== (entity as { id: string }).id,
    );
    return entity;
  }

  increment(
    _criteria: Partial<T>,
    _field: keyof T & string,
    _by: number,
  ): Promise<void> {
    return Promise.resolve();
  }

  createQueryBuilder() {
    const insertResult = this.insertResult;
    return {
      insert: () => ({
        into: () => ({
          values: () => ({
            orIgnore: () => ({
              execute: () => Promise.resolve(insertResult),
            }),
          }),
        }),
      }),
    };
  }

  private matchesWhere(
    entity: T,
    where: Record<string, unknown> | undefined,
  ): boolean {
    if (!where) {
      return true;
    }
    for (const [k, v] of Object.entries(where)) {
      if ((entity as Record<string, unknown>)[k] !== v) {
        return false;
      }
    }
    return true;
  }
}

describe('SegmentationService', () => {
  let service: SegmentationService;
  let segments: InMemoryRepo<Segment>;
  let memberships: InMemoryRepo<Membership>;
  let rules: InMemoryRepo<Rule>;
  let events: InMemoryRepo<SegmentEvent>;
  let experiments: InMemoryRepo<AbExperiment>;
  let assignments: InMemoryRepo<AbAssignment>;
  let assignmentCache: Map<string, string>;
  let sizeCache: Map<string, number>;
  let signalCache: Map<string, unknown>;

  beforeEach(async () => {
    segments = new InMemoryRepo<Segment>();
    rules = new InMemoryRepo<Rule>();
    memberships = new InMemoryRepo<Membership>();
    events = new InMemoryRepo<SegmentEvent>();
    experiments = new InMemoryRepo<AbExperiment>();
    assignments = new InMemoryRepo<AbAssignment>();
    assignmentCache = new Map();
    sizeCache = new Map();
    signalCache = new Map();

    segments.relationResolvers['rules'] = (segment) =>
      rules.rows.filter(
        (rule) => (rule as Rule).segmentId === (segment as Segment).id,
      );
    segments.relationResolvers['memberships'] = (segment) =>
      memberships.rows.filter(
        (m) => (m as Membership).segmentId === (segment as Segment).id,
      );
    segments.relationResolvers['events'] = (segment) =>
      events.rows.filter(
        (e) => (e as SegmentEvent).segmentId === (segment as Segment).id,
      );

    const cache = {
      getSignal: jest.fn(async (userId: string) => {
        return signalCache.get(userId) ?? null;
      }),
      setSignal: jest.fn(async (signal) => {
        signalCache.set(signal.userId, signal);
      }),
      deleteSignal: jest.fn(async (userId: string) => {
        signalCache.delete(userId);
        return 1;
      }),
      getSize: jest.fn(async (segmentId: string) => {
        const value = sizeCache.get(segmentId);
        return value ?? null;
      }),
      setSize: jest.fn(async (segmentId: string, size: number) => {
        sizeCache.set(segmentId, size);
      }),
      getAssignment: jest.fn(async (key: string, userId: string) => {
        return assignmentCache.get(`${key}:${userId}`) ?? null;
      }),
      setAssignment: jest.fn(
        async (key: string, userId: string, variant: string) => {
          assignmentCache.set(`${key}:${userId}`, variant);
        },
      ),
    } as unknown as RedisCacheService;

    const module = await Test.createTestingModule({
      providers: [
        SegmentationService,
        SegmentationRuleEngineService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              if (key === 'SEGMENTATION_SEED_DEFAULTS') return 'false';
              return fallback;
            }),
          },
        },
        { provide: RedisCacheService, useValue: cache },
        { provide: getRepositoryToken(Segment), useValue: segments },
        { provide: getRepositoryToken(Rule), useValue: rules },
        { provide: getRepositoryToken(Membership), useValue: memberships },
        { provide: getRepositoryToken(SegmentEvent), useValue: events },
        { provide: getRepositoryToken(AbExperiment), useValue: experiments },
        { provide: getRepositoryToken(AbAssignment), useValue: assignments },
      ],
    }).compile();

    service = module.get(SegmentationService);

    await service.onModuleInit();
    await service.onApplicationBootstrap();
  });

  it('creates and lists segments with their rules', async () => {
    const created = await service.createSegment({
      slug: 'vip-us',
      name: 'VIP US',
      description: 'Top US players',
      type: SegmentationType.RULE_BASED,
      status: SegmentStatus.ACTIVE,
      rules: [
        {
          field: 'country',
          operator: RuleOperator.EQUALS,
          value: 'US',
          order: 0,
        },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.rules.length).toBe(1);
    expect(created.rules[0].field).toBe('country');

    const list = await service.listSegments();
    expect(list.map((s) => s.slug)).toContain('vip-us');
  });

  it('rejects duplicate slugs', async () => {
    await service.createSegment({
      slug: 'dup-1',
      name: 'Dup',
      rules: [{ field: 'a', operator: RuleOperator.EQUALS, value: 1 }],
    });

    await expect(
      service.createSegment({
        slug: 'dup-1',
        name: 'Dup',
        rules: [{ field: 'a', operator: RuleOperator.EQUALS, value: 1 }],
      }),
    ).rejects.toThrow();
  });

  it('computes overlap between two segments', async () => {
    const s1 = await service.createSegment({
      slug: 'overlap-a',
      name: 'Overlap A',
      status: SegmentStatus.ACTIVE,
      rules: [{ field: 'country', operator: RuleOperator.EQUALS, value: 'US' }],
    });
    const s2 = await service.createSegment({
      slug: 'overlap-b',
      name: 'Overlap B',
      status: SegmentStatus.ACTIVE,
      rules: [
        {
          field: 'platform',
          operator: RuleOperator.EQUALS,
          value: 'ios',
        },
      ],
    });

    memberships.rows.push(
      { id: '1', segmentId: s1.id, userId: 'u1' } as unknown as Membership,
      { id: '2', segmentId: s1.id, userId: 'u2' } as unknown as Membership,
      { id: '3', segmentId: s2.id, userId: 'u1' } as unknown as Membership,
      { id: '4', segmentId: s2.id, userId: 'u3' } as unknown as Membership,
    );

    const result = await service.overlap({
      segmentIds: [s1.id, s2.id],
    });

    expect(result.overlappingUsers).toBe(1);
    expect(result.perSegmentSizes[s1.id]).toBe(2);
    expect(result.perSegmentSizes[s2.id]).toBe(2);
  });

  it('computes zero overlap when a segment has no members', async () => {
    const s1 = await service.createSegment({
      slug: 'empty-a',
      name: 'Empty A',
      status: SegmentStatus.ACTIVE,
      rules: [{ field: 'level', operator: RuleOperator.EQUALS, value: 99 }],
    });
    const s2 = await service.createSegment({
      slug: 'empty-b',
      name: 'Empty B',
      status: SegmentStatus.ACTIVE,
      rules: [
        { field: 'platform', operator: RuleOperator.EQUALS, value: 'ios' },
      ],
    });

    memberships.rows.push({
      id: 'x1',
      segmentId: s2.id,
      userId: 'u9',
    } as unknown as Membership);

    const result = await service.overlap({
      segmentIds: [s1.id, s2.id],
    });

    expect(result.overlappingUsers).toBe(0);
  });

  it('assigns deterministic A/B variants with sticky cache', async () => {
    const experiment = await service.createExperiment({
      key: 'homepage-variant',
      name: 'Homepage CTA',
      variants: [
        { key: 'control', weight: 0.5 },
        { key: 'treat', weight: 0.5 },
      ],
      status: ExperimentStatus.RUNNING,
    });

    const first = await service.assignVariant(experiment.id, {
      userId: 'user-stable-1',
    });
    const second = await service.assignVariant(experiment.id, {
      userId: 'user-stable-1',
    });

    expect(first.variantKey).toBeDefined();
    // Determinism: same user gets same variant across calls.
    expect(first.variantKey).toBe(second.variantKey);
    // First call writes to DB+cache; second call short-circuits via Redis cache.
    expect(first.persisted).toBe(true);
    expect(second.persisted).toBe(false);
    expect(assignmentCache.size).toBe(1);
  });

  it('reports segment size via cache or database', async () => {
    const segment = await service.createSegment({
      slug: 'size-test',
      name: 'Size Test',
      status: SegmentStatus.ACTIVE,
      rules: [{ field: 'level', operator: RuleOperator.EQUALS, value: 5 }],
    });

    memberships.rows.push(
      { id: 'm1', segmentId: segment.id, userId: 'a' } as unknown as Membership,
      { id: 'm2', segmentId: segment.id, userId: 'b' } as unknown as Membership,
    );

    const result = await service.getSize(segment.id);
    expect(result.size).toBe(2);
  });
});
