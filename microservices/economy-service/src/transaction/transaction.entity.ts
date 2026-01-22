import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransactionType {
  PURCHASE = 'purchase',
  REFILL = 'refill',
  REFUND = 'refund',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum CurrencyType {
  COINS = 'coins',
  GEMS = 'gems',
  ENERGY = 'energy',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'enum',
    enum: CurrencyType,
  })
  currency: CurrencyType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  shopItemId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  externalTransactionId: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
