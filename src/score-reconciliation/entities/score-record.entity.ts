import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ScoreRecordSource {
  /** Written by the normal submission path */
  SUBMISSION = 'submission',
  /** Restored from the queue by the reconciliation job */
  RECONCILIATION = 'reconciliation',
}

/** The final, stored result of a puzzle score submission. */
@Entity('score_records')
export class ScoreRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Same key as the queued submission, so each submission maps to one record */
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
    default: ScoreRecordSource.SUBMISSION,
  })
  source: ScoreRecordSource;

  /** Set when reconciliation finds this record disagrees with the queue */
  @Column({ name: 'needs_review', type: 'boolean', default: false })
  needsReview: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
