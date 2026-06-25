import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PushNotificationType {
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional',
  SYSTEM = 'system',
}

export enum PushNotificationPriority {
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

export enum PushNotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'push_notifications' })
export class PushNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({
    type: 'enum',
    enum: PushNotificationType,
    default: PushNotificationType.TRANSACTIONAL,
  })
  type: PushNotificationType;

  @Column({
    type: 'enum',
    enum: PushNotificationPriority,
    default: PushNotificationPriority.NORMAL,
  })
  priority: PushNotificationPriority;

  @Column({
    type: 'enum',
    enum: PushNotificationStatus,
    default: PushNotificationStatus.PENDING,
  })
  status: PushNotificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  segmentId: string;

  @Column({ nullable: true })
  abTestId: string;

  @Column({ nullable: true })
  abVariant: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
