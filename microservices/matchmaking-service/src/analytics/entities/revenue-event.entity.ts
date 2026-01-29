import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('revenue_events')
@Index(['playerId', 'timestamp'])
@Index(['type', 'timestamp'])
export class RevenueEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  playerId: string;

  @Column()
  type: string; // iap, subscription, ad_revenue

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  productId: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  timestamp: Date;
}
