import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum EmailStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  FAILED = 'failed',
}

export enum EmailPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum EmailType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  NEWSLETTER = 'newsletter',
  NOTIFICATION = 'notification',
  SYSTEM = 'system',
}

@Entity({ name: 'emails' })
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
@Index(['messageId'])
export class Email {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column()
  toEmail: string;

  @Column({ nullable: true })
  toName: string;

  @Column()
  fromEmail: string;

  @Column({ nullable: true })
  fromName: string;

  @Column({ nullable: true })
  replyTo: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  htmlContent: string;

  @Column({ type: 'text', nullable: true })
  textContent: string;

  @Column({ nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  templateData: Record<string, any>;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({
    type: 'enum',
    enum: EmailPriority,
    default: EmailPriority.NORMAL,
  })
  priority: EmailPriority;

  @Column({
    type: 'enum',
    enum: EmailType,
    default: EmailType.TRANSACTIONAL,
  })
  type: EmailType;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastError: string;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  openedAt: Date;

  @Column({ nullable: true })
  clickedAt: Date;

  @Column({ nullable: true })
  bouncedAt: Date;

  @Column({ nullable: true })
  complainedAt: Date;

  @Column({ default: 0 })
  openCount: number;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ type: 'jsonb', nullable: true })
  clickedLinks: Array<{ url: string; clickedAt: Date }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;
}
