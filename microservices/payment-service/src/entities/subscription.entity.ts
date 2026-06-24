import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  BillingInterval,
  SubscriptionStatus,
} from '../providers/payment-provider.interface';

@Entity('subscriptions')
@Index(['userId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  planId: string;

  @Column()
  planName: string;

  @Column({ type: 'varchar', default: 'active' })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'varchar', default: 'month' })
  billingInterval: BillingInterval;

  @Column({ default: 'stripe' })
  provider: string;

  @Column({ nullable: true })
  externalSubscriptionId: string | null;

  @Column({ nullable: true })
  paymentMethodId: string | null;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
