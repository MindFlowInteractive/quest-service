import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  txHash: string;

  @Column()
  sourceAccount: string;

  @Column()
  destinationAccount: string;

  @Column('decimal', { precision: 18, scale: 7 })
  amount: number;

  @Column()
  asset: string;

  @Column()
  ledger: number;

  @Column({ default: false })
  confirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}