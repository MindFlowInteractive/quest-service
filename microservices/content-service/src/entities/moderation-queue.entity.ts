import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Submission } from './submission.entity.js';

export enum QueueStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum QueuePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('moderation_queue')
@Index(['status', 'priority', 'createdAt'])
@Index(['assignedTo', 'status'])
@Index(['isEscalated', 'status'])
export class ModerationQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  submissionId: string;

  @OneToOne(() => Submission, (submission) => submission.queueEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;

  @Column({
    type: 'enum',
    enum: QueueStatus,
    default: QueueStatus.PENDING,
  })
  @Index()
  status: QueueStatus;

  @Column({
    type: 'enum',
    enum: QueuePriority,
    default: QueuePriority.NORMAL,
  })
  @Index()
  priority: QueuePriority;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  assignedTo: string;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'boolean', default: false })
  @Index()
  isEscalated: boolean;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  dueAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
