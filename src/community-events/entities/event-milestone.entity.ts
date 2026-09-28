import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CommunityEvent } from './community-event.entity';

@Entity('event_milestones')
@Index(['eventId', 'requiredScore'])
export class EventMilestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  requiredScore: number;

  @Column({ type: 'jsonb' })
  reward: {
    type: 'points' | 'badge' | 'item' | 'currency' | 'title';
    value?: number;
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  claimedCount: number;

  @Column({ type: 'int', nullable: true })
  maxClaims?: number;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CommunityEvent, (event) => event.milestones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: CommunityEvent;
}
