import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { WebhookDelivery } from './webhook-delivery.entity';

export type WebhookEvent = 'puzzle.solved' | 'achievement.unlocked' | 'session.ended' | 'user.registered' | 'leaderboard.updated';

@Entity('webhooks')
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  secret: string;

  @Column('simple-array')
  events: WebhookEvent[];

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  userId?: string; // For user-specific webhooks

  @Column({ nullable: true })
  appId?: string; // For app-specific webhooks

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WebhookDelivery, delivery => delivery.webhook)
  deliveries: WebhookDelivery[];
}