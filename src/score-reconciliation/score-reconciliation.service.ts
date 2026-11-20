import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  ScoreSubmission,
  ScoreSubmissionStatus,
} from './entities/score-submission.entity';
import { ScoreRecord, ScoreRecordSource } from './entities/score-record.entity';
import {
  ScoreConflict,
  ScoreConflictStatus,
  ScoreFieldDifference,
} from './entities/score-conflict.entity';
import {
  ReconciliationDetails,
  ReconciliationStatus,
  ReconciliationTrigger,
  ScoreReconciliationReport,
} from './entities/score-reconciliation-report.entity';

/** Most keys kept per list in a report's details. */
export const MAX_DETAIL_KEYS = 100;

const COMPARED_FIELDS: ScoreFieldDifference['field'][] = [
  'userId',
  'puzzleId',
  'score',
  'completionTimeMs',
];

/** Lists every compared field where the queue and the stored record differ. */
export function compareSubmission(
  submission: ScoreSubmission,
  record: ScoreRecord,
): ScoreFieldDifference[] {
  const differences: ScoreFieldDifference[] = [];
  for (const field of COMPARED_FIELDS) {
    const queued = submission[field] ?? null;
    const stored = record[field] ?? null;
    if (queued !== stored) differences.push({ field, queued, stored });
  }
  return differences;
}

function isUniqueViolation(error: unknown): boolean {
  const err = error as { code?: string; driverError?: { code?: string } };
  return err?.code === '23505' || err?.driverError?.code === '23505';
}

function pushCapped<T>(list: T[], value: T, details: ReconciliationDetails) {
  if (list.length < MAX_DETAIL_KEYS) list.push(value);
  else details.truncated = true;
}

type Outcome = 'matched' | 'restored' | 'flagged' | 'already_flagged';

export interface RunOptions {
  lookbackHours?: number;
  now?: Date;
}

@Injectable()
export class ScoreReconciliationService {
  private readonly logger = new Logger(ScoreReconciliationService.name);
  private running = false;

  constructor(
    @InjectRepository(ScoreSubmission)
    private readonly submissionRepo: Repository<ScoreSubmission>,

    @InjectRepository(ScoreRecord)
    private readonly recordRepo: Repository<ScoreRecord>,

    @InjectRepository(ScoreConflict)
    private readonly conflictRepo: Repository<ScoreConflict>,

    @InjectRepository(ScoreReconciliationReport)
    private readonly reportRepo: Repository<ScoreReconciliationReport>,

    private readonly configService: ConfigService,
  ) {}

  // ─── Configuration ────────────────────────────────────────────────────────

  private numberSetting(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  get enabled(): boolean {
    return (
      this.configService.get<string>('SCORE_RECONCILIATION_ENABLED', 'true') !==
      'false'
    );
  }

  get lookbackHours(): number {
    return this.numberSetting('SCORE_RECONCILIATION_LOOKBACK_HOURS', 72);
  }

  /** Recent submissions are skipped so in-flight retries can finish first. */
  get graceMinutes(): number {
    return this.numberSetting('SCORE_RECONCILIATION_GRACE_MINUTES', 10);
  }

  get batchSize(): number {
    return this.numberSetting('SCORE_RECONCILIATION_BATCH_SIZE', 500);
  }

  // ─── Scheduling ───────────────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR, { name: 'score-reconciliation' })
  async scheduledRun(): Promise<void> {
    if (!this.enabled) return;
    if (this.running) {
      this.logger.warn('Previous reconciliation still running, skipping');
      return;
    }
    try {
      await this.run(ReconciliationTrigger.SCHEDULED);
    } catch (error) {
      this.logger.error(
        `Scheduled reconciliation failed: ${(error as Error).message}`,
      );
    }
  }

  get isRunning(): boolean {
    return this.running;
  }

  // ─── Run ──────────────────────────────────────────────────────────────────

  /**
   * Compares queued submissions in the window with their stored records,
   * restores missing records and flags mismatches. Always saves a report,
   * including when the run fails part way.
   */
  async run(
    trigger: ReconciliationTrigger,
    options: RunOptions = {},
  ): Promise<ScoreReconciliationReport> {
    if (this.running) {
      throw new ConflictException('A reconciliation run is already running');
    }
    this.running = true;
    try {
      return await this.runLocked(trigger, options);
    } finally {
      this.running = false;
    }
  }

  private async runLocked(
    trigger: ReconciliationTrigger,
    options: RunOptions,
  ): Promise<ScoreReconciliationReport> {
    const now = options.now ?? new Date();
    const lookbackHours = options.lookbackHours ?? this.lookbackHours;
    const windowEnd = new Date(now.getTime() - this.graceMinutes * 60_000);
    const windowStart = new Date(now.getTime() - lookbackHours * 3_600_000);

    const report = await this.reportRepo.save(
      this.reportRepo.create({
        trigger,
        status: ReconciliationStatus.RUNNING,
        windowStart,
        windowEnd,
        checked: 0,
        matched: 0,
        restored: 0,
        conflictsFlagged: 0,
        alreadyFlagged: 0,
        errors: 0,
        details: {
          restoredKeys: [],
          conflictKeys: [],
          errors: [],
          truncated: false,
        },
        failureReason: null,
        finishedAt: null,
      }),
    );

    try {
      await this.processWindow(report);
      report.status = ReconciliationStatus.COMPLETED;
    } catch (error) {
      report.status = ReconciliationStatus.FAILED;
      report.failureReason = (error as Error).message;
      this.logger.error(
        `Reconciliation ${report.id} failed: ${report.failureReason}`,
      );
    }
    report.finishedAt = new Date();

    const saved = await this.reportRepo.save(report);
    this.logger.log(
      `Reconciliation ${saved.id} ${saved.status}: checked=${saved.checked} ` +
        `restored=${saved.restored} flagged=${saved.conflictsFlagged} ` +
        `errors=${saved.errors}`,
    );
    return saved;
  }

  private async processWindow(report: ScoreReconciliationReport) {
    const take = this.batchSize;
    for (let skip = 0; ; skip += take) {
      const submissions = await this.submissionRepo.find({
        where: { createdAt: Between(report.windowStart, report.windowEnd) },
        order: { createdAt: 'ASC', id: 'ASC' },
        skip,
        take,
      });
      if (submissions.length === 0) break;

      const records = await this.recordRepo.find({
        where: { idempotencyKey: In(submissions.map((s) => s.idempotencyKey)) },
      });
      const recordsByKey = new Map(records.map((r) => [r.idempotencyKey, r]));

      for (const submission of submissions) {
        report.checked += 1;
        try {
          const outcome = await this.reconcileOne(
            submission,
            recordsByKey.get(submission.idempotencyKey),
            report,
          );
          this.count(report, submission, outcome);
        } catch (error) {
          report.errors += 1;
          pushCapped(
            report.details.errors,
            {
              idempotencyKey: submission.idempotencyKey,
              message: (error as Error).message,
            },
            report.details,
          );
        }
      }

      if (submissions.length < take) break;
    }
  }

  private count(
    report: ScoreReconciliationReport,
    submission: ScoreSubmission,
    outcome: Outcome,
  ) {
    switch (outcome) {
      case 'matched':
        report.matched += 1;
        break;
      case 'restored':
        report.restored += 1;
        pushCapped(
          report.details.restoredKeys,
          submission.idempotencyKey,
          report.details,
        );
        break;
      case 'flagged':
        report.conflictsFlagged += 1;
        pushCapped(
          report.details.conflictKeys,
          submission.idempotencyKey,
          report.details,
        );
        break;
      case 'already_flagged':
        report.alreadyFlagged += 1;
        break;
    }
  }

  private async reconcileOne(
    submission: ScoreSubmission,
    record: ScoreRecord | undefined,
    report: ScoreReconciliationReport,
  ): Promise<Outcome> {
    if (!record) {
      const restored = await this.restoreRecord(submission);
      if (restored) {
        await this.markConfirmed(submission);
        return 'restored';
      }
      // Someone wrote the record while we were looking; compare with theirs.
      record =
        (await this.recordRepo.findOne({
          where: { idempotencyKey: submission.idempotencyKey },
        })) ?? undefined;
      if (!record) {
        throw new Error('Record insert conflicted but no record was found');
      }
    }

    const differences = compareSubmission(submission, record);
    if (differences.length === 0) {
      await this.markConfirmed(submission);
      return 'matched';
    }
    return this.flagConflict(submission, record, differences, report);
  }

  /** Writes the missing record. Returns false if it already exists. */
  private async restoreRecord(submission: ScoreSubmission): Promise<boolean> {
    try {
      await this.recordRepo.save(
        this.recordRepo.create({
          idempotencyKey: submission.idempotencyKey,
          userId: submission.userId,
          puzzleId: submission.puzzleId,
          score: submission.score,
          completionTimeMs: submission.completionTimeMs ?? null,
          source: ScoreRecordSource.RECONCILIATION,
          needsReview: false,
        }),
      );
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  private async markConfirmed(submission: ScoreSubmission) {
    if (submission.status === ScoreSubmissionStatus.CONFIRMED) return;
    await this.submissionRepo.update(submission.id, {
      status: ScoreSubmissionStatus.CONFIRMED,
      confirmedAt: new Date(),
    });
  }

  /**
   * Records a conflict for review. The stored record keeps its values; it is
   * only marked as needing review.
   */
  private async flagConflict(
    submission: ScoreSubmission,
    record: ScoreRecord,
    differences: ScoreFieldDifference[],
    report: ScoreReconciliationReport,
  ): Promise<Outcome> {
    const open = await this.conflictRepo.findOne({
      where: {
        idempotencyKey: submission.idempotencyKey,
        status: ScoreConflictStatus.OPEN,
      },
    });
    if (open) return 'already_flagged';

    await this.conflictRepo.save(
      this.conflictRepo.create({
        reportId: report.id,
        idempotencyKey: submission.idempotencyKey,
        submissionId: submission.id,
        recordId: record.id,
        differences,
        status: ScoreConflictStatus.OPEN,
        resolution: null,
        resolvedAt: null,
      }),
    );
    if (!record.needsReview) {
      await this.recordRepo.update(record.id, { needsReview: true });
    }
    return 'flagged';
  }

  // ─── Reports and conflicts ────────────────────────────────────────────────

  listReports(limit = 20): Promise<ScoreReconciliationReport[]> {
    return this.reportRepo.find({
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getReport(reportId: string): Promise<ScoreReconciliationReport> {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException(
        `Reconciliation report "${reportId}" not found`,
      );
    }
    return report;
  }

  listConflicts(
    status: ScoreConflictStatus = ScoreConflictStatus.OPEN,
    limit = 100,
  ): Promise<ScoreConflict[]> {
    return this.conflictRepo.find({
      where: { status },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Closes a conflict after a person has handled it. Clears the record's
   * review flag once it has no other open conflicts.
   */
  async resolveConflict(
    conflictId: string,
    resolution: string,
  ): Promise<ScoreConflict> {
    const conflict = await this.conflictRepo.findOne({
      where: { id: conflictId },
    });
    if (!conflict) {
      throw new NotFoundException(`Score conflict "${conflictId}" not found`);
    }
    if (conflict.status === ScoreConflictStatus.RESOLVED) {
      throw new ConflictException('Score conflict is already resolved');
    }

    conflict.status = ScoreConflictStatus.RESOLVED;
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();
    const saved = await this.conflictRepo.save(conflict);

    const stillOpen = await this.conflictRepo.count({
      where: { recordId: conflict.recordId, status: ScoreConflictStatus.OPEN },
    });
    if (stillOpen === 0) {
      await this.recordRepo.update(conflict.recordId, { needsReview: false });
    }
    return saved;
  }
}
