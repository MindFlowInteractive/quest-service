import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SmsMessageStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum SmsPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum SmsMessageType {
  OTP = 'otp',
  ALERT = 'alert',
  TRANSACTIONAL = 'transactional',
  REMINDER = 'reminder',
  SYSTEM = 'system',
}

@Entity({ name: 'sms_messages' })
@Index(['normalizedPhoneNumber', 'createdAt'])
@Index(['userId', 'status'])
@Index(['providerMessageId'])
export class SmsMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column()
  phoneNumber: string;

  @Column()
  normalizedPhoneNumber: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'simple-enum',
    enum: SmsMessageStatus,
    default: SmsMessageStatus.PENDING,
  })
  status: SmsMessageStatus;

  @Column({
    type: 'simple-enum',
    enum: SmsPriority,
    default: SmsPriority.NORMAL,
  })
  priority: SmsPriority;

  @Column({
    type: 'simple-enum',
    enum: SmsMessageType,
    default: SmsMessageType.TRANSACTIONAL,
  })
  type: SmsMessageType;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  providerMessageId: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ nullable: true })
  templateName: string;

  @Column({ type: 'simple-json', nullable: true })
  templateData: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  correlationId: string;

  @Column({ nullable: true })
  otpPurpose: string;

  @Column({ default: 1 })
  segments: number;

  @Column({ type: 'float', nullable: true })
  estimatedCost: number;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ nullable: true })
  lastError: string;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  nextRetryAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
