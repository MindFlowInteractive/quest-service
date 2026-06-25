import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CacheJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum CacheJobType {
  WARM = 'warm',
  INVALIDATE = 'invalidate',
  OPTIMIZE = 'optimize',
  ADAPTIVE = 'adaptive',
}

@Entity('cache_jobs')
export class CacheJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: CacheJobType })
  type: CacheJobType;

  @Column({
    type: 'enum',
    enum: CacheJobStatus,
    default: CacheJobStatus.PENDING,
  })
  status: CacheJobStatus;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'timestamptz' })
  scheduledFor: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  targetKeys: string[];

  @Column({ type: 'varchar', length: 300, nullable: true })
  targetPattern: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  warmedKeys: number;

  @Column({ type: 'int', default: 0 })
  skippedKeys: number;

  @Column({ type: 'int', default: 0 })
  invalidatedKeys: number;

  @Column({ type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
