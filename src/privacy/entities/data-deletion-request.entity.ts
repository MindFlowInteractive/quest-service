import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DeletionStatus {
  PENDING = 'pending',
  CONFIRMATION_REQUIRED = 'confirmation_required',
  PROCESSING = 'processing',
  ANONYMIZING = 'anonymizing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DeletionType {
  FULL_ACCOUNT = 'full_account',
  SELECTIVE_DATA = 'selective_data',
  RIGHT_TO_BE_FORGOTTEN = 'right_to_be_forgotten',
}

export enum DeletionReason {
  USER_REQUEST = 'user_request',
  INACTIVITY = 'inactivity',
  TERMS_VIOLATION = 'terms_violation',
  DATA_BREACH = 'data_breach',
  LEGAL_REQUIREMENT = 'legal_requirement',
  OTHER = 'other',
}

@Entity('data_deletion_requests')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
@Index(['scheduledFor'])
export class DataDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: DeletionStatus,
    default: DeletionStatus.PENDING,
  })
  status: DeletionStatus;

  @Column({
    name: 'deletion_type',
    type: 'enum',
    enum: DeletionType,
    default: DeletionType.FULL_ACCOUNT,
  })
  deletionType: DeletionType;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: DeletionReason,
    default: DeletionReason.USER_REQUEST,
  })
  reason: DeletionReason;

  @Column({ name: 'reason_details', type: 'text', nullable: true })
  reasonDetails: string;

  @Column({ type: 'jsonb', name: 'entities_to_delete', nullable: true })
  entitiesToDelete: string[];

  @Column({ name: 'confirmation_token', nullable: true })
  confirmationToken: string;

  @Column({ name: 'confirmation_sent_at', type: 'timestamptz', nullable: true })
  confirmationSentAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'cooldown_period_hours', type: 'int', default: 24 })
  cooldownPeriodHours: number;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'anonymized_user_id', nullable: true })
  anonymizedUserId: string;

  @Column({ type: 'jsonb', name: 'deletion_log', nullable: true })
  deletionLog: {
    entitiesProcessed: string[];
    recordsDeleted: number;
    recordsAnonymized: number;
    errors: string[];
  };

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

