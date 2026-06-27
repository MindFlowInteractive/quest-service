import { ReportsService } from './reports.service';
import { ReportStatus, SeverityTier } from '../entities/report-status.enum';

/**
 * Lightweight in-memory stub for the vulnerability-report repository.
 * Captures inserts and transitions so the test can assert state changes
 * without touching a real database.
 */
function makeRepo() {
  const rows: Array<{ id: string; status: ReportStatus; researcherId: string; bountyId: string | null; severity: SeverityTier; assessedSeverity?: SeverityTier | null; transitions: any[] }> = [];
  return {
    rows,
    create(input: any) {
      rows.push({ id: 'generated-' + (rows.length + 1), transitions: [], status: ReportStatus.NEW, ...input });
      return rows[rows.length - 1];
    },
    async save(entity: any) {
      if (!entity.id) {
        entity.id = 'generated-' + (rows.length + 1);
        rows.push(entity);
      }
      const idx = rows.findIndex((r) => r.id === entity.id);
      if (idx === -1) rows.push(entity);
      else rows[idx] = entity;
      return entity;
    },
    async findOne({ where }: any) {
      return rows.find((r) => r.id === where.id) ?? null;
    },
    async findAndCount({ where = {}, skip = 0, take = 20 }: any) {
      const filtered = rows.filter((r) =>
        Object.keys(where).every((k) => (r as any)[k] === where[k]),
      );
      return [filtered.slice(skip, skip + take), filtered.length];
    },
  };
}

function makeResearchers() {
  return {
    async findById(_id: string) {
      return { id: 'r-1', handle: 'tester', isBlocked: false };
    },
    async incrementReportCounts() {
      return { id: 'r-1' };
    },
  };
}

function makeBounties() {
  return {
    async findBySlug(slug: string) {
      return slug ? { id: 'b-1', slug, status: 'open', tiers: [], currency: 'USD' } : null;
    },
    async findById(_id: string) {
      return { id: 'b-1', slug: 'demo', tiers: [], currency: 'USD' };
    },
    resolveRewardAmount(_b: any, sev: SeverityTier) {
      return { min: 100, max: 100, currency: 'USD', suggested: 100 };
    },
  };
}

function makeRewards() {
  return { async createFromFix() {}, async findByReport() { return null; } };
}

function makeSeverity() {
  return { assess: () => ({ severity: SeverityTier.MEDIUM, score: 50, rationale: {} }) };
}

describe('ReportsService — workflow state machine', () => {
  let svc: ReportsService;
  let repo: ReturnType<typeof makeRepo>;

  beforeEach(() => {
    repo = makeRepo();
    svc = new ReportsService(
      repo as any,
      makeResearchers() as any,
      makeBounties() as any,
      makeSeverity() as any,
      makeRewards() as any,
    );
  });

  it('initialises new reports at status NEW', async () => {
    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.HIGH,
    });
    expect(r.status).toBe(ReportStatus.NEW);
    expect(r.transitions).toEqual([]);
  });

  it('rejects transitions that are not in the allowed map', async () => {
    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.HIGH,
    });
    await expect(
      svc.transition(r.id, {
        toStatus: ReportStatus.FIXED,
        actor: 'admin',
      }),
    ).rejects.toThrow(/Invalid transition/);
  });

  it('walks NEW → TRIAGED → VERIFIED → FIXED and auto-creates a reward', async () => {
    const rewards = makeRewards();
    const createSpy = jest.spyOn(rewards, 'createFromFix');

    svc = new ReportsService(
      repo as any,
      makeResearchers() as any,
      makeBounties() as any,
      makeSeverity() as any,
      rewards as any,
    );

    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.HIGH,
    });

    await svc.transition(r.id, { toStatus: ReportStatus.TRIAGED, actor: 'sec1' });
    const triaged = await svc.getById(r.id);
    expect(triaged.status).toBe(ReportStatus.TRIAGED);
    expect(triaged.triagedBy).toBe('sec1');

    await svc.transition(r.id, { toStatus: ReportStatus.VERIFIED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.FIXED, actor: 'dev1' });

    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('records an audit trail for every transition', async () => {
    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.LOW,
    });
    await svc.transition(r.id, { toStatus: ReportStatus.REJECTED, actor: 'admin', note: 'spam' });
    const after = await svc.getById(r.id);
    expect(after.transitions).toHaveLength(1);
    expect(after.transitions[0]).toMatchObject({
      from: ReportStatus.NEW,
      to: ReportStatus.REJECTED,
      by: 'admin',
      note: 'spam',
    });
  });

  it('credits reputation only once across the New→Triaged→Verified→Fixed walk', async () => {
    const researchers = makeResearchers();
    const incrSpy = jest.spyOn(researchers, 'incrementReportCounts');

    svc = new ReportsService(
      repo as any,
      researchers as any,
      makeBounties() as any,
      makeSeverity() as any,
      makeRewards() as any,
    );

    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.CRITICAL,
    });
    // submit() fires the 'submitted' counter increment. Reset to isolate the
    // acceptance path.
    incrSpy.mockClear();

    await svc.transition(r.id, { toStatus: ReportStatus.TRIAGED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.VERIFIED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.FIXED, actor: 'dev1' });

    // Only the FIXED transition should credit. VERIFIED is no-credit.
    expect(incrSpy).toHaveBeenCalledTimes(1);
    expect(incrSpy).toHaveBeenCalledWith(
      'r-1',
      ReportStatus.FIXED,
      expect.any(String),
      expect.any(String),
      null,
    );
  });

  it('does not re-credit on a reopen through Fixed → Triaged → Verified → Fixed', async () => {
    const researchers = makeResearchers();
    const incrSpy = jest.spyOn(researchers, 'incrementReportCounts');

    svc = new ReportsService(
      repo as any,
      researchers as any,
      makeBounties() as any,
      makeSeverity() as any,
      makeRewards() as any,
    );

    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.HIGH,
    });
    incrSpy.mockClear();

    await svc.transition(r.id, { toStatus: ReportStatus.TRIAGED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.VERIFIED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.FIXED, actor: 'dev1' });
    // Reopen
    await svc.transition(r.id, { toStatus: ReportStatus.TRIAGED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.VERIFIED, actor: 'sec1' });
    await svc.transition(r.id, { toStatus: ReportStatus.FIXED, actor: 'dev1' });

    expect(incrSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects severityOverride on non-TRIAGED transitions', async () => {
    const r = await svc.submit({
      researcherId: 'r-1',
      bountySlug: 'demo',
      title: 'x',
      description: 'd',
      stepsToReproduce: 's',
      affectedComponent: 'auth',
      severity: SeverityTier.LOW,
    });
    await svc.transition(r.id, { toStatus: ReportStatus.TRIAGED, actor: 'sec1' });
    await expect(
      svc.transition(r.id, {
        toStatus: ReportStatus.VERIFIED,
        actor: 'sec1',
        severityOverride: SeverityTier.HIGH,
      }),
    ).rejects.toThrow(/severityOverride is only valid/);
  });
});
