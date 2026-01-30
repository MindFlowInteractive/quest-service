import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Submission } from './submission.entity.js';

export enum ModerationActionType {
  REVIEW = 'review',
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  ESCALATE = 'escalate',
  REQUEST_CHANGES = 'request_changes',
  AUTO_CHECK = 'auto_check',
}

export enum ModerationDecision {
  PENDING_REVIEW = 'pending_review',
  AUTO_APPROVED = 'auto_approved',
  MANUALLY_APPROVED = 'manually_approved',
  REJECTED_QUALITY = 'rejected_quality',
  REJECTED_INAPPROPRIATE = 'rejected_inappropriate',
  REJECTED_SPAM = 'rejected_spam',
  REJECTED_DUPLICATE = 'rejected_duplicate',
  REJECTED_POLICY_VIOLATION = 'rejected_policy_violation',
  REQUIRES_CHANGES = 'requires_changes',
  ESCALATED = 'escalated',
}

export interface AutomatedCheckResults {
  profanityCheck: { passed: boolean; flaggedTerms?: string[] };
  spamCheck: { passed: boolean; spamScore?: number };
  duplicateCheck: { passed: boolean; similarContentIds?: string[] };
  qualityCheck: { passed: boolean; score: number };
  contentValidation: { passed: boolean; errors?: string[] };
}

@Entity('moderation_actions')
@Index(['submissionId', 'createdAt'])
@Index(['moderatorId', 'createdAt'])
@Index(['actionType', 'createdAt'])
@Index(['decision', 'createdAt'])
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  submissionId: string;

  @ManyToOne(() => Submission, (submission) => submission.moderationActions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submissionId' })
  submission: Submission;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  moderatorId: string;

  @Column({
    type: 'enum',
    enum: ModerationActionType,
  })
  @Index()
  actionType: ModerationActionType;

  @Column({
    type: 'enum',
    enum: ModerationDecision,
    nullable: true,
  })
  @Index()
  decision: ModerationDecision;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-array', nullable: true })
  requiredChanges: string[];

  @Column({ type: 'simple-array', nullable: true })
  flaggedContent: string[];

  @Column({ type: 'int', nullable: true })
  qualityScore: number;

  @Column({ type: 'boolean', default: false })
  isAutomated: boolean;

  @Column({ type: 'jsonb', nullable: true })
  automatedCheckResults: AutomatedCheckResults;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
