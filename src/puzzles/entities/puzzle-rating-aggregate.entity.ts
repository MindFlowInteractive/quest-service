import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Puzzle } from './puzzle.entity';

@Entity('puzzle_rating_aggregates')
export class PuzzleRatingAggregate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index({ unique: true })
  puzzleId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  // Rating distribution for histogram
  @Column({ type: 'jsonb', default: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;
}
