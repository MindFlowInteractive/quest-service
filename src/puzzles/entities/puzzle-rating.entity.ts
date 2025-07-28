import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Puzzle } from './puzzle.entity';

@Entity('puzzle_ratings')
@Index(['userId', 'puzzleId'], { unique: true })
@Index(['puzzleId', 'rating'])
export class PuzzleRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  @Index()
  rating: number; // 1.00 to 5.00

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficultyVote?: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'text', nullable: true })
  review?: string;

  @Column({ type: 'simple-array', default: [] })
  tags: string[]; // e.g., 'fun', 'challenging', 'confusing', 'well-designed'

  @Column({ type: 'boolean', default: false })
  @Index()
  isReported: boolean;

  @Column({ type: 'boolean', default: true })
  @Index()
  isPublic: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    completionTime?: number;
    attemptsBeforeRating?: number;
    hintsUsedBeforeRating?: number;
    scoreWhenRated?: number;
    deviceUsed?: string;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;
}
