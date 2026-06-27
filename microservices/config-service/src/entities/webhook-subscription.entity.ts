import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  serviceName: string;

  @Column({ type: 'varchar' })
  webhookUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  events: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 3 })
  retryAttempts: number;

  @Column({ type: 'int', default: 5000 })
  retryDelayMs: number;

  @Column({ type: 'varchar', nullable: true })
  secret: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
