import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ScoreConflictStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
}

/** One field where the queued submission and stored record disagree. */
export interface ScoreFieldDifference {
  field: 'userId' | 'puzzleId' | 'score' | 'completionTimeMs';
  queued: string | number | null;
  stored: string | number | null;
}

/**
 * A mismatch between a queued submission and its stored record. Neither side
 * is changed automatically; a person reviews and resolves it.
 */
@Entity('score_reconciliation_conflicts')
@Index(['idempotencyKey', 'status'])
export class ScoreConflict {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Report of the run that first found the mismatch */
  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  idempotencyKey: string;

  @Column({ name: 'submission_id', type: 'uuid' })
  submissionId: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId: string;

  @Column({ type: 'jsonb' })
  differences: ScoreFieldDifference[];

  @Index()
  @Column({ type: 'varchar', length: 16, default: ScoreConflictStatus.OPEN })
  status: ScoreConflictStatus;

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({
    name: 'resolved_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  resolvedAt: Date | null;
}
