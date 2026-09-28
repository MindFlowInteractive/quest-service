import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ContentDeliveryEventType {
  MANIFEST = 'manifest',
  LOAD = 'load',
  DELTA = 'delta',
  BUNDLE = 'bundle',
  PREFETCH = 'prefetch',
}

@Entity('content_delivery_events')
@Index(['eventType', 'createdAt'])
@Index(['contentId', 'createdAt'])
export class ContentDeliveryEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  contentId: string | null;

  @Column({ type: 'varchar', length: 20 })
  eventType: ContentDeliveryEventType;

  @CreateDateColumn()
  createdAt: Date;
}