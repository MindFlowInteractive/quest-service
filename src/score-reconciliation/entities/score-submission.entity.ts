import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ScoreSubmissionStatus {
  /** Accepted from the client, final record not written yet */
  PENDING = 'pending',
  /** Final score record written */
  CONFIRMED = 'confirmed',
  /** Retries gave up before the final record was written */
  FAILED = 'failed',
}

/**
 * A queued score submission. The submission queue writes one row per
 * accepted client submission, keyed by the client's idempotency key, and the
 * reconciliation job reads these rows back to check the final records.
 */
@Entity('score_submissions')
@Index(['status', 'createdAt'])
export class ScoreSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'idempotency_key', type: 'varchar', length: 128 })
  idempotencyKey: string;

  @Index()
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId: string;

  @Column({ name: 'puzzle_id', type: 'varchar', length: 64 })
  puzzleId: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ name: 'completion_time_ms', type: 'int', nullable: true })
  completionTimeMs: number | null;

  @Column({
    type: 'varchar',
    length: 16,
    default: ScoreSubmissionStatus.PENDING,
  })
  status: ScoreSubmissionStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({
    name: 'confirmed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  confirmedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
