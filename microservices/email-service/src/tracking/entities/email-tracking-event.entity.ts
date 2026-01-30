import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TrackingEventType {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
  DROPPED = 'dropped',
  DEFERRED = 'deferred',
}

export enum BounceType {
  HARD = 'hard',
  SOFT = 'soft',
  TRANSIENT = 'transient',
}

@Entity({ name: 'email_tracking_events' })
@Index(['emailId', 'eventType'])
@Index(['eventType', 'createdAt'])
@Index(['userId'])
export class EmailTrackingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  emailId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: TrackingEventType,
  })
  eventType: TrackingEventType;

  @Column({ nullable: true })
  messageId: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  url: string;

  @Column({
    type: 'enum',
    enum: BounceType,
    nullable: true,
  })
  bounceType: BounceType;

  @Column({ nullable: true })
  bounceReason: string;

  @Column({ nullable: true })
  complaintType: string;

  @Column({ type: 'jsonb', nullable: true })
  rawEvent: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
