import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { SeasonalEvent } from './seasonal-event.entity';

@Entity('player_events')
@Index(['playerId', 'eventId'])
@Index(['eventId', 'score'])
@Unique(['playerId', 'eventId'])
export class PlayerEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'uuid' })
  @Index()
  eventId: string;

  @Column({ type: 'int', default: 0 })
  @Index()
  score: number;

  @Column({ type: 'simple-array', default: [] })
  completedPuzzles: string[]; // Array of puzzle IDs

  @Column({ type: 'jsonb', default: [] })
  rewards: Array<{
    rewardId: string;
    rewardName: string;
    rewardType: string;
    earnedAt: Date;
  }>;

  @Column({ type: 'int', default: 0 })
  puzzlesCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalAttempts: number;

  @Column({ type: 'int', default: 0 })
  correctAnswers: number;

  @Column({ type: 'int', default: 0 })
  hintsUsed: number;

  @Column({ type: 'int', default: 0 })
  averageCompletionTime: number; // in seconds

  @Column({ type: 'int', default: 1 })
  currentStreak: number;

  @Column({ type: 'int', default: 1 })
  bestStreak: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  firstJoinedAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  statistics: {
    categoryBreakdown?: Record<string, number>; // category -> puzzles completed
    difficultyBreakdown?: Record<string, number>; // difficulty -> puzzles completed
    dailyProgress?: Array<{
      date: string;
      puzzlesCompleted: number;
      pointsEarned: number;
    }>;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => SeasonalEvent, (event) => event.playerEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: SeasonalEvent;
}
