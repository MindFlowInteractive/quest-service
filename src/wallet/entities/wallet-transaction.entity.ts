import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type WalletTransactionType = 'reward' | 'purchase' | 'stake' | 'unstake' | 'swap';

@Entity('wallet_transactions')
@Index(['walletAddress', 'txHash'], { unique: true })
@Index(['walletAddress', 'createdAt'])
@Index(['walletAddress', 'type'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 56 })
  @Index()
  walletAddress: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index()
  txHash: string;

  @Column({
    type: 'enum',
    enum: ['reward', 'purchase', 'stake', 'unstake', 'swap'],
  })
  type: WalletTransactionType;

  @Column('decimal', { precision: 20, scale: 7 })
  amount: string;

  @Column({ type: 'varchar', length: 12 })
  token: string; // Asset code

  @Column({ type: 'varchar', length: 56, nullable: true })
  counterparty?: string; // Other party in transaction

  @Column({ type: 'int' })
  ledger: number;

  @CreateDateColumn()
  createdAt: Date;
}