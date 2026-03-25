import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Webhook } from './webhook.entity';

export type DeliveryStatus = 'pending' | 'success' | 'failed' | 'retry';

@Entity('webhook_deliveries')
@Index(['webhookId', 'createdAt'], { order: { createdAt: 'DESC' } })
export class WebhookDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  webhookId: string;

  @ManyToOne(() => Webhook, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'webhookId' })
  webhook: Webhook;

  @Column()
  event: string;

  @Column('jsonb')
  payload: any;

  @Column({ type: 'text', nullable: true })
  signature: string;

  @Column({ default: 'pending' })
  status: DeliveryStatus;

  @Column({ nullable: true })
  responseCode?: number;

  @Column({ type: 'text', nullable: true })
  responseBody?: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  nextRetryAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;
}