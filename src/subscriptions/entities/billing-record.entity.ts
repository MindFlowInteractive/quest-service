import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BillingStatus } from '../enums/subscription.enums';
import { Subscription } from './subscription.entity';

@Entity('billing_records')
@Index(['subscriptionId', 'createdAt'])
@Index(['userId', 'status'])
export class BillingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  subscriptionId: string;

  @ManyToOne(() => Subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  /** Amount charged in USD cents. */
  @Column({ type: 'int' })
  amountInCents: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: BillingStatus,
    default: BillingStatus.PENDING,
  })
  @Index()
  status: BillingStatus;

  /** External payment intent / charge ID from the billing provider. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalPaymentId?: string;

  /** Human-readable description, e.g. "Pro Monthly - October 2026". */
  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  /** Timestamps of the billing period this record covers. */
  @Column({ type: 'timestamp with time zone', nullable: true })
  periodStart?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  periodEnd?: Date;

  /** Failure reason from the payment provider. */
  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  /** Number of attempts made for this billing cycle. */
  @Column({ type: 'int', default: 1 })
  attemptCount: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
