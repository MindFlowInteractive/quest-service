import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  SubscriptionTier,
  SubscriptionStatus,
  BillingInterval,
} from '../enums/subscription.enums';

@Entity('subscriptions')
@Index(['userId', 'status'])
@Index(['status', 'currentPeriodEnd'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** References users.id — kept as a plain column to avoid cross-module entity coupling. */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  tier: SubscriptionTier;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  @Index()
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billingInterval: BillingInterval;

  /** Price in USD cents at the time of subscription. */
  @Column({ type: 'int', default: 0 })
  priceInCents: number;

  /** External billing provider subscription ID (e.g., Stripe sub_xxx). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalSubscriptionId?: string;

  /** External billing provider customer ID. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalCustomerId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndDate?: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  currentPeriodStart: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  /** If set, the subscription remains active until this date after cancellation. */
  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelEffectiveDate?: Date;

  /** Reason provided by the user on cancellation. */
  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  /** Whether to automatically renew at period end. */
  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  /** Tier the subscription should move to on next renewal (used for scheduled upgrades/downgrades). */
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    nullable: true,
  })
  scheduledTier?: SubscriptionTier;

  /** How many consecutive successful billing cycles. */
  @Column({ type: 'int', default: 0 })
  successfulBillingCycles: number;

  /** How many consecutive failed billing attempts in current cycle. */
  @Column({ type: 'int', default: 0 })
  failedBillingAttempts: number;

  /** Flexible JSONB bag for provider-specific metadata and future fields. */
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
