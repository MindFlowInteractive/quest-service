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
import { SeasonalEvent } from './seasonal-event.entity';

@Entity('event_rewards')
@Index(['eventId', 'requiredScore'])
@Index(['eventId', 'type'])
export class EventReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: 'points' | 'badge' | 'item' | 'currency' | 'title' | 'avatar' | 'nft';

  @Column({ type: 'int', default: 0 })
  @Index()
  requiredScore: number;

  @Column({ type: 'int', nullable: true })
  requiredPuzzles?: number; // Number of puzzles that must be completed

  @Column({ type: 'jsonb' })
  rewardData: {
    value?: number; // For points or currency
    imageUrl?: string; // For badges, items, avatars
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    metadata?: Record<string, any>;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  claimedCount: number;

  @Column({ type: 'int', nullable: true })
  maxClaims?: number; // Limit how many players can claim this reward

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // For sorting rewards in UI

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SeasonalEvent, (event) => event.rewards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: SeasonalEvent;
}
