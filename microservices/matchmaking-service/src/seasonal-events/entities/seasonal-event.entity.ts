import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EventPuzzle } from './event-puzzle.entity';
import { PlayerEvent } from './player-event.entity';
import { EventReward } from './event-reward.entity';

@Entity('seasonal_events')
@Index(['startDate', 'endDate'])
@Index(['isActive'])
export class SeasonalEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  theme?: string; // e.g., 'halloween', 'christmas', 'summer', 'spring'

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  endDate: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'jsonb', nullable: true })
  bannerImage?: {
    url: string;
    alt: string;
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    maxParticipants?: number;
    minLevel?: number;
    eventType?: 'competitive' | 'casual' | 'special';
    rules?: string[];
  };

  @Column({ type: 'int', default: 0 })
  participantCount: number;

  @Column({ type: 'int', default: 0 })
  totalPuzzlesCompleted: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => EventPuzzle, (puzzle) => puzzle.event, {
    cascade: true,
  })
  puzzles: EventPuzzle[];

  @OneToMany(() => PlayerEvent, (playerEvent) => playerEvent.event, {
    cascade: true,
  })
  playerEvents: PlayerEvent[];

  @OneToMany(() => EventReward, (reward) => reward.event, {
    cascade: true,
  })
  rewards: EventReward[];
}
