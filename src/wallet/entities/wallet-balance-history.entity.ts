import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('wallet_balance_history')
@Index(['publicKey', 'network'])
export class WalletBalanceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  publicKey: string;

  @Column()
  network: string;

  @Column()
  assetCode: string;

  @Column({ nullable: true })
  issuer: string;

  @Column('decimal', { precision: 20, scale: 7 })
  balance: string;

  @CreateDateColumn()
  recordedAt: Date;
}