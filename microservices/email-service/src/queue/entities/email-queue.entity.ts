import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum QueueStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DEAD_LETTER = 'dead_letter',
}

@Entity({ name: 'email_queue' })
@Index(['status', 'priority', 'scheduledAt'])
@Index(['emailId'])
export class EmailQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  emailId: string;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING,
  })
  status: QueueStatus;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 5 })
  maxAttempts: number;

  @Column({ nullable: true })
  lastAttemptAt: Date;

  @Column({ nullable: true })
  nextAttemptAt: Date;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'jsonb', nullable: true })
  errorHistory: Array<{
    error: string;
    timestamp: Date;
    attempt: number;
  }>;

  @Column({ nullable: true })
  lockedBy: string;

  @Column({ nullable: true })
  lockedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
