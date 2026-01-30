import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UnsubscribeReason {
  USER_REQUEST = 'user_request',
  BOUNCE = 'bounce',
  COMPLAINT = 'complaint',
  ADMIN = 'admin',
  INACTIVE = 'inactive',
}

export enum EmailCategory {
  ALL = 'all',
  MARKETING = 'marketing',
  NEWSLETTER = 'newsletter',
  NOTIFICATIONS = 'notifications',
  TRANSACTIONAL = 'transactional',
}

@Entity({ name: 'email_unsubscribes' })
@Index(['email', 'category'], { unique: true })
@Index(['userId'])
export class EmailUnsubscribe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: EmailCategory,
    default: EmailCategory.ALL,
  })
  category: EmailCategory;

  @Column({
    type: 'enum',
    enum: UnsubscribeReason,
    default: UnsubscribeReason.USER_REQUEST,
  })
  reason: UnsubscribeReason;

  @Column({ nullable: true })
  unsubscribeToken: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  resubscribedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
