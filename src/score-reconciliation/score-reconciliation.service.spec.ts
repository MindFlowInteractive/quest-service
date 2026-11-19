import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';

import {
  MAX_DETAIL_KEYS,
  ScoreReconciliationService,
  compareSubmission,
} from './score-reconciliation.service';
import {
  ScoreSubmission,
  ScoreSubmissionStatus,
} from './entities/score-submission.entity';
import { ScoreRecord, ScoreRecordSource } from './entities/score-record.entity';
import {
  ScoreConflict,
  ScoreConflictStatus,
} from './entities/score-conflict.entity';
import {
  ReconciliationStatus,
  ReconciliationTrigger,
  ScoreReconciliationReport,
} from './entities/score-reconciliation-report.entity';

// ─── Mock factory ────────────────────────────────────────────────────────────

const mockRepo = () => ({
  create: jest.fn((d: object) => ({ ...d })),
  save: jest.fn((d: object & { id?: string }) =>
    Promise.resolve({ ...d, id: d.id ?? 'generated-id' }),
  ),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([]),
  count: jest.fn().mockResolvedValue(0),
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-01T12:00:00Z');

const makeSubmission = (
  key: string,
  overrides: Partial<ScoreSubmission> = {},
): ScoreSubmission => ({
  id: `sub-${key}`,
  idempotencyKey: key,
  userId: 'user-1',
  puzzleId: 'puzzle-1',
  score: 1200,
  completionTimeMs: 45_000,
  status: ScoreSubmissionStatus.PENDING,
  attempts: 1,
  lastError: null,
  confirmedAt: null,
  createdAt: new Date('2026-06-01T10:00:00Z'),
  updatedAt: new Date('2026-06-01T10:00:00Z'),
  ...overrides,
});

const makeRecord = (
  key: string,
  overrides: Partial<ScoreRecord> = {},
): ScoreRecord => ({
  id: `rec-${key}`,
  idempotencyKey: key,
  userId: 'user-1',
  puzzleId: 'puzzle-1',
  score: 1200,
  completionTimeMs: 45_000,
  source: ScoreRecordSource.SUBMISSION,
  needsReview: false,
  createdAt: new Date('2026-06-01T10:00:01Z'),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ScoreReconciliationService', () => {
  let service: ScoreReconciliationService;
  let submissionRepo: ReturnType<typeof mockRepo>;
  let recordRepo: ReturnType<typeof mockRepo>;
  let conflictRepo: ReturnType<typeof mockRepo>;
  let reportRepo: ReturnType<typeof mockRepo>;
  let settings: Record<string, string>;

  /** Makes the submission repo return these rows for the first batch only. */
  const queue = (...submissions: ScoreSubmission[]) => {
    submissionRepo.find
      .mockResolvedValueOnce(submissions)
      .mockResolvedValue([]);
  };

  const run = () =>
    service.run(ReconciliationTrigger.MANUAL, { now: NOW, lookbackHours: 24 });

  beforeEach(async () => {
    submissionRepo = mockRepo();
    recordRepo = mockRepo();
    conflictRepo = mockRepo();
    reportRepo = mockRepo();
    settings = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreReconciliationService,
        {
          provide: getRepositoryToken(ScoreSubmission),
          useValue: submissionRepo,
        },
        { provide: getRepositoryToken(ScoreRecord), useValue: recordRepo },
        { provide: getRepositoryToken(ScoreConflict), useValue: conflictRepo },
        {
          provide: getRepositoryToken(ScoreReconciliationReport),
          useValue: reportRepo,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, fallback?: string) => settings[key] ?? fallback,
            ),
          },
        },
      ],
    }).compile();

    service = module.get(ScoreReconciliationService);
  });

  // ─── compareSubmission ────────────────────────────────────────────────────

  describe('compareSubmission', () => {
    it('finds no differences for a matching record', () => {
      expect(compareSubmission(makeSubmission('k'), makeRecord('k'))).toEqual(
        [],
      );
    });

    it('lists each differing field with both values', () => {
      const diff = compareSubmission(
        makeSubmission('k', { score: 1500 }),
        makeRecord('k', { score: 900, completionTimeMs: null }),
      );

      expect(diff).toEqual([
        { field: 'score', queued: 1500, stored: 900 },
        { field: 'completionTimeMs', queued: 45_000, stored: null },
      ]);
    });
  });

  // ─── Window ───────────────────────────────────────────────────────────────

  describe('window', () => {
    it('uses the lookback and leaves the grace period alone', async () => {
      const report = await run();

      expect(report.windowStart).toEqual(new Date('2026-05-31T12:00:00Z'));
      expect(report.windowEnd).toEqual(new Date('2026-06-01T11:50:00Z'));
    });

    it('reads the grace period and batch size from config', async () => {
      settings.SCORE_RECONCILIATION_GRACE_MINUTES = '30';
      settings.SCORE_RECONCILIATION_BATCH_SIZE = '2';
      submissionRepo.find
        .mockResolvedValueOnce([makeSubmission('a'), makeSubmission('b')])
        .mockResolvedValueOnce([makeSubmission('c')]);
      recordRepo.find.mockResolvedValue([
        makeRecord('a'),
        makeRecord('b'),
        makeRecord('c'),
      ]);

      const report = await run();

      expect(report.windowEnd).toEqual(new Date('2026-06-01T11:30:00Z'));
      expect(submissionRepo.find).toHaveBeenCalledTimes(2);
      expect(submissionRepo.find).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ skip: 2, take: 2 }),
      );
      expect(report.checked).toBe(3);
    });
  });

  // ─── Restoring missing records ────────────────────────────────────────────

  describe('missing records', () => {
    it('restores a missing record from the queue', async () => {
      queue(makeSubmission('lost', { status: ScoreSubmissionStatus.FAILED }));

      const report = await run();

      expect(recordRepo.create).toHaveBeenCalledWith({
        idempotencyKey: 'lost',
        userId: 'user-1',
        puzzleId: 'puzzle-1',
        score: 1200,
        completionTimeMs: 45_000,
        source: ScoreRecordSource.RECONCILIATION,
        needsReview: false,
      });
      expect(submissionRepo.update).toHaveBeenCalledWith(
        'sub-lost',
        expect.objectContaining({ status: ScoreSubmissionStatus.CONFIRMED }),
      );
      expect(report).toMatchObject({ checked: 1, restored: 1, matched: 0 });
      expect(report.details.restoredKeys).toEqual(['lost']);
    });

    it('compares with a record written by someone else mid-run', async () => {
      queue(makeSubmission('race'));
      recordRepo.save.mockRejectedValueOnce({ driverError: { code: '23505' } });
      recordRepo.findOne.mockResolvedValue(makeRecord('race'));

      const report = await run();

      expect(report).toMatchObject({ restored: 0, matched: 1 });
    });
  });

  // ─── Matching records ─────────────────────────────────────────────────────

  describe('matching records', () => {
    it('counts a match and confirms a pending submission', async () => {
      queue(makeSubmission('ok'));
      recordRepo.find.mockResolvedValue([makeRecord('ok')]);

      const report = await run();

      expect(report).toMatchObject({ checked: 1, matched: 1 });
      expect(recordRepo.save).not.toHaveBeenCalled();
      expect(submissionRepo.update).toHaveBeenCalledWith(
        'sub-ok',
        expect.objectContaining({ status: ScoreSubmissionStatus.CONFIRMED }),
      );
    });

    it('does not touch a submission that is already confirmed', async () => {
      queue(makeSubmission('ok', { status: ScoreSubmissionStatus.CONFIRMED }));
      recordRepo.find.mockResolvedValue([makeRecord('ok')]);

      await run();

      expect(submissionRepo.update).not.toHaveBeenCalled();
    });
  });

  // ─── Conflicts ────────────────────────────────────────────────────────────

  describe('conflicting records', () => {
    it('flags a conflict without overwriting the stored record', async () => {
      queue(makeSubmission('bad', { score: 1500 }));
      recordRepo.find.mockResolvedValue([makeRecord('bad', { score: 900 })]);

      const report = await run();

      expect(recordRepo.save).not.toHaveBeenCalled();
      expect(recordRepo.update).toHaveBeenCalledWith('rec-bad', {
        needsReview: true,
      });
      expect(recordRepo.update).toHaveBeenCalledTimes(1);
      expect(conflictRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'bad',
          submissionId: 'sub-bad',
          recordId: 'rec-bad',
          status: ScoreConflictStatus.OPEN,
          differences: [{ field: 'score', queued: 1500, stored: 900 }],
        }),
      );
      expect(submissionRepo.update).not.toHaveBeenCalled();
      expect(report).toMatchObject({ conflictsFlagged: 1, matched: 0 });
      expect(report.details.conflictKeys).toEqual(['bad']);
    });

    it('does not open a second conflict for the same key', async () => {
      queue(makeSubmission('bad', { score: 1500 }));
      recordRepo.find.mockResolvedValue([
        makeRecord('bad', { score: 900, needsReview: true }),
      ]);
      conflictRepo.findOne.mockResolvedValue({ id: 'c-1' });

      const report = await run();

      expect(conflictRepo.save).not.toHaveBeenCalled();
      expect(report).toMatchObject({ conflictsFlagged: 0, alreadyFlagged: 1 });
    });
  });

  // ─── Reports ──────────────────────────────────────────────────────────────

  describe('reports', () => {
    it('saves a completed report every run, even with nothing to check', async () => {
      const report = await run();

      expect(reportRepo.save).toHaveBeenCalledTimes(2);
      expect(reportRepo.save.mock.calls[0][0]).toMatchObject({
        status: ReconciliationStatus.RUNNING,
      });
      expect(report).toMatchObject({
        status: ReconciliationStatus.COMPLETED,
        trigger: ReconciliationTrigger.MANUAL,
        checked: 0,
      });
      expect(report.finishedAt).toBeInstanceOf(Date);
    });

    it('records a failed report when the run breaks', async () => {
      submissionRepo.find.mockRejectedValue(new Error('db unavailable'));

      const report = await run();

      expect(report).toMatchObject({
        status: ReconciliationStatus.FAILED,
        failureReason: 'db unavailable',
      });
    });

    it('keeps going when one submission fails', async () => {
      queue(makeSubmission('boom'), makeSubmission('fine'));
      recordRepo.find.mockResolvedValue([makeRecord('fine')]);
      recordRepo.save.mockRejectedValueOnce(new Error('write failed'));

      const report = await run();

      expect(report).toMatchObject({
        status: ReconciliationStatus.COMPLETED,
        checked: 2,
        errors: 1,
        matched: 1,
      });
      expect(report.details.errors).toEqual([
        { idempotencyKey: 'boom', message: 'write failed' },
      ]);
    });

    it('caps the keys kept in details', async () => {
      const many = Array.from({ length: MAX_DETAIL_KEYS + 5 }, (_, i) =>
        makeSubmission(`k${i}`),
      );
      queue(...many);

      const report = await run();

      expect(report.restored).toBe(MAX_DETAIL_KEYS + 5);
      expect(report.details.restoredKeys).toHaveLength(MAX_DETAIL_KEYS);
      expect(report.details.truncated).toBe(true);
    });
  });

  // ─── Overlap and scheduling ───────────────────────────────────────────────

  describe('overlap protection', () => {
    it('rejects a manual run while another is running', async () => {
      let release!: (value: ScoreSubmission[]) => void;
      submissionRepo.find.mockReturnValueOnce(
        new Promise<ScoreSubmission[]>((resolve) => (release = resolve)),
      );

      const first = run();
      await new Promise((r) => setImmediate(r));

      expect(service.isRunning).toBe(true);
      await expect(run()).rejects.toThrow(ConflictException);

      release([]);
      await first;
      expect(service.isRunning).toBe(false);
    });

    it('frees the lock if the first report cannot be saved', async () => {
      reportRepo.save.mockRejectedValueOnce(new Error('db down'));

      await expect(run()).rejects.toThrow('db down');
      expect(service.isRunning).toBe(false);
    });
  });

  describe('scheduledRun', () => {
    it('runs with the scheduled trigger', async () => {
      const spy = jest.spyOn(service, 'run');

      await service.scheduledRun();

      expect(spy).toHaveBeenCalledWith(ReconciliationTrigger.SCHEDULED);
    });

    it('does nothing when disabled', async () => {
      settings.SCORE_RECONCILIATION_ENABLED = 'false';
      const spy = jest.spyOn(service, 'run');

      await service.scheduledRun();

      expect(spy).not.toHaveBeenCalled();
    });

    it('never throws out of the cron handler', async () => {
      jest.spyOn(service, 'run').mockRejectedValue(new Error('boom'));

      await expect(service.scheduledRun()).resolves.toBeUndefined();
    });
  });

  // ─── Conflict review ──────────────────────────────────────────────────────

  describe('resolveConflict', () => {
    const openConflict = () => ({
      id: 'c-1',
      recordId: 'rec-bad',
      status: ScoreConflictStatus.OPEN,
      resolution: null,
      resolvedAt: null,
    });

    it('closes the conflict and clears the review flag', async () => {
      conflictRepo.findOne.mockResolvedValue(openConflict());
      conflictRepo.count.mockResolvedValue(0);

      const result = await service.resolveConflict('c-1', 'kept stored score');

      expect(result).toMatchObject({
        status: ScoreConflictStatus.RESOLVED,
        resolution: 'kept stored score',
      });
      expect(recordRepo.update).toHaveBeenCalledWith('rec-bad', {
        needsReview: false,
      });
    });

    it('keeps the review flag while other conflicts are open', async () => {
      conflictRepo.findOne.mockResolvedValue(openConflict());
      conflictRepo.count.mockResolvedValue(1);

      await service.resolveConflict('c-1', 'checked');

      expect(recordRepo.update).not.toHaveBeenCalled();
    });

    it('rejects an already resolved conflict', async () => {
      conflictRepo.findOne.mockResolvedValue({
        ...openConflict(),
        status: ScoreConflictStatus.RESOLVED,
      });

      await expect(service.resolveConflict('c-1', 'again')).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws for an unknown conflict', async () => {
      await expect(service.resolveConflict('nope', 'x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReport', () => {
    it('throws for an unknown report', async () => {
      await expect(service.getReport('nope')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
