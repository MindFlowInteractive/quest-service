import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentStatus } from '../providers/payment-provider.interface';

@Entity('payments')
@Index(['userId', 'createdAt'])
@Index(['externalTransactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'usd' })
  currency: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentStatus;

  @Column({ default: 'stripe' })
  provider: string;

  @Column({ nullable: true })
  externalTransactionId: string | null;

  @Column({ nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ nullable: true })
  paymentMethodId: string | null;

  @Column({ nullable: true })
  refundId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
