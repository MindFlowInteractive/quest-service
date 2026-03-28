import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { WebhookDelivery } from './webhook-delivery.entity';
import { WebhookEvent } from '../webhook.constants';

@Entity('webhooks')
@Index(['userId', 'appId'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ select: false })
  secret: string;

  @Column('text', { array: true })
  events: WebhookEvent[];

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ nullable: true })
  appId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WebhookDelivery, (delivery) => delivery.webhook)
  deliveries: WebhookDelivery[];
}