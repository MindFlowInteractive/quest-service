import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notification_deliveries')
export class NotificationDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  notificationId: string;

  @Column({ type: 'varchar', length: 50 })
  channel: string; // in_app, email, push, scheduler, feedback

  @Column({ type: 'varchar', length: 50 })
  status: string; // queued, sent, delivered, failed, received

  @Column({ type: 'text', nullable: true })
  details?: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
