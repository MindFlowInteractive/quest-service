import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
} from 'typeorm';
import { PlayerRating } from './player-rating.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

export enum RatingChangeReason {
  PUZZLE_COMPLETED = 'puzzle_completed',
  PUZZLE_FAILED = 'puzzle_failed',
  INACTIVITY_DECAY = 'inactivity_decay',
  SEASONAL_RESET = 'seasonal_reset',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('rating_history')
@Index(['playerRatingId', 'createdAt'])
@Index(['createdAt'])
export class RatingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerRatingId: string;

  @ManyToOne(() => PlayerRating, (rating) => rating.ratingHistory, {
    onDelete: 'CASCADE',
  })
  playerRating: PlayerRating;

  @Column({ type: 'int' })
  oldRating: number;

  @Column({ type: 'int' })
  newRating: number;

  @Column({ type: 'int' })
  ratingChange: number;

  @Column({
    type: 'varchar',
    length: 30,
    default: RatingChangeReason.PUZZLE_COMPLETED,
  })
  @Index()
  reason: RatingChangeReason;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  puzzleId: string;

  @ManyToOne(() => Puzzle, { nullable: true, onDelete: 'SET NULL' })
  puzzle: Puzzle;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  puzzleDifficulty: string;

  @Column({ type: 'int', nullable: true })
  timeTaken: number; // in seconds

  @Column({ type: 'int', nullable: true })
  hintsUsed: number;

  @Column({ type: 'int', nullable: true })
  attempts: number;

  @Column({ type: 'boolean', nullable: true })
  wasCompleted: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    expectedWinProbability?: number;
    kFactor?: number;
    performanceScore?: number;
    bonusFactors?: string[];
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
