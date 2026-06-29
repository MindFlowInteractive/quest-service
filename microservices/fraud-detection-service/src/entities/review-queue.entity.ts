import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReviewPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ReviewStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  ESCALATED = 'escalated',
}

@Entity('review_queue')
@Index(['playerId'])
@Index(['status'])
@Index(['priority'])
@Index(['assignedTo'])
export class ReviewQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  /** Linked fraud alert that triggered the review */
  @Column({ type: 'uuid', nullable: true })
  alertId?: string;

  @Column({ type: 'enum', enum: ReviewPriority, default: ReviewPriority.MEDIUM })
  priority: ReviewPriority;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', default: {} })
  evidence: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewerNotes?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  outcome?: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
