import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Receipt } from './receipt.entity';
import { Sms } from './sms.entity';

export enum MessageStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  UNDELIVERED = 'undelivered',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum MessageType {
  OTP = 'otp',
  ALERT = 'alert',
  TRANSACTIONAL = 'transactional',
  SYSTEM = 'system',
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity({ name: 'sms_messages' })
@Index(['toPhoneNumber', 'createdAt'])
@Index(['status', 'scheduledAt'])
@Index(['providerMessageId'])
@Index(['userId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  toPhoneNumber: string;

  @Column({ nullable: true })
  fromNumber: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'simple-enum',
    enum: MessageType,
    default: MessageType.TRANSACTIONAL,
  })
  type: MessageType;

  @Column({
    type: 'simple-enum',
    enum: MessagePriority,
    default: MessagePriority.NORMAL,
  })
  priority: MessagePriority;

  @Column({
    type: 'simple-enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  providerMessageId: string;

  @Column({ nullable: true })
  templateName: string;

  @Column({ type: 'simple-json', nullable: true })
  templateData: Record<string, any>;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  otpHash: string;

  @Column({ nullable: true })
  otpExpiresAt: Date;

  @Column({ default: 0 })
  otpAttempts: number;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  lastError: string;

  @ManyToOne(() => Sms, (sms) => sms.messages, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender: Sms;

  @Column({ nullable: true })
  senderId: string;

  @OneToMany(() => Receipt, (receipt) => receipt.message)
  receipts: Receipt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
