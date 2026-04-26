import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('balances')
@Index(['walletId', 'assetCode', 'assetIssuer'], { unique: true })
export class Balance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column()
  assetCode: string;

  @Column({ nullable: true })
  assetIssuer: string;

  @Column({ type: 'varchar', default: '0' })
  balance: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
