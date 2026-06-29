import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column({ unique: true })
  @Index()
  transactionHash: string;

  @Column()
  type: string;

  @Column({ type: 'varchar' })
  amount: string;

  @Column()
  assetCode: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.SUCCESS,
  })
  status: TransactionStatus;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}
