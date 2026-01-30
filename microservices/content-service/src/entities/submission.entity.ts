import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Content } from './content.entity.js';

export enum SubmissionStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes',
  CANCELLED = 'cancelled',
}

export interface ValidationResults {
  isValid: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  autoApprovalEligible: boolean;
  automatedChecks: {
    hasValidContent: boolean;
    hasDescription: boolean;
    hasValidCategory: boolean;
    passesQualityCheck: boolean;
    hasValidMedia: boolean;
    hasCompleteMetadata: boolean;
    noProfanity: boolean;
    notSpam: boolean;
    notDuplicate: boolean;
  };
}

@Entity('submissions')
@Index(['contentId', 'status'])
@Index(['submittedBy', 'status'])
@Index(['status', 'createdAt'])
@Index(['assignedModerator', 'status'])
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  contentId: string;

  @ManyToOne(() => Content, (content) => content.submissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column({ type: 'uuid' })
  @Index()
  submittedBy: string;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  @Index()
  status: SubmissionStatus;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  snapshot: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  submitterNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  validationResults: ValidationResults;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  assignedModerator: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewCompletedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('ModerationAction', 'submission')
  moderationActions: any[];

  @OneToOne('ModerationQueue', 'submission')
  queueEntry: any;
}
