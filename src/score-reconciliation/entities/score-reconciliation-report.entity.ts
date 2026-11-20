import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ReconciliationTrigger {
  SCHEDULED = 'scheduled',
  MANUAL = 'manual',
}

export enum ReconciliationStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Keys behind the counts, capped so a bad run cannot write a huge row.
 * `truncated` is true when any list hit the cap.
 */
export interface ReconciliationDetails {
  restoredKeys: string[];
  conflictKeys: string[];
  errors: { idempotencyKey: string; message: string }[];
  truncated: boolean;
}

/** The result of one reconciliation run. One row is written per run. */
@Entity('score_reconciliation_reports')
export class ScoreReconciliationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 16 })
  trigger: ReconciliationTrigger;

  @Column({ type: 'varchar', length: 16 })
  status: ReconciliationStatus;

  /** Submissions created at or after this time were checked */
  @Column({ name: 'window_start', type: 'timestamp with time zone' })
  windowStart: Date;

  /** Submissions created after this time were left for the next run */
  @Column({ name: 'window_end', type: 'timestamp with time zone' })
  windowEnd: Date;

  /** Submissions examined */
  @Column({ type: 'int', default: 0 })
  checked: number;

  /** Submissions whose stored record matched */
  @Column({ type: 'int', default: 0 })
  matched: number;

  /** Missing records recreated from the queue */
  @Column({ type: 'int', default: 0 })
  restored: number;

  /** New conflicts flagged in this run */
  @Column({ name: 'conflicts_flagged', type: 'int', default: 0 })
  conflictsFlagged: number;

  /** Mismatches that already had an open conflict */
  @Column({ name: 'already_flagged', type: 'int', default: 0 })
  alreadyFlagged: number;

  /** Submissions that could not be processed */
  @Column({ type: 'int', default: 0 })
  errors: number;

  @Column({ type: 'jsonb', default: {} })
  details: ReconciliationDetails;

  /** Why the run failed, when status is "failed" */
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string | null;

  @Index()
  @CreateDateColumn({ name: 'started_at', type: 'timestamp with time zone' })
  startedAt: Date;

  @Column({
    name: 'finished_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  finishedAt: Date | null;
}
