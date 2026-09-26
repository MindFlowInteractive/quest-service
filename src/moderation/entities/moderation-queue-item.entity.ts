import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { QueuePriority } from '../enums/moderation.enums';

@Entity('moderation_queue')
@Index(['priority', 'createdAt'])
@Index(['flagId'])
@Index(['assignedTo'])
export class ModerationQueueItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  flagId: string;

  @Column({ type: 'int', default: QueuePriority.NORMAL })
  priority: number;

  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
