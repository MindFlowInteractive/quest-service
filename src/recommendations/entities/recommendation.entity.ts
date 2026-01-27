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
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Entity('recommendations')
@Index(['userId', 'puzzleId'], { unique: true })
@Index(['userId', 'createdAt'])
@Index(['algorithm', 'createdAt'])
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  algorithm: 'collaborative' | 'content-based' | 'hybrid' | 'popular' | 'fallback';

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  @Index()
  score: number; // 0.0 to 1.0 confidence score

  @Column({ type: 'text', nullable: true })
  reason: string; // explanation for the recommendation

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    similarUsers?: string[];
    similarPuzzles?: string[];
    features?: Record<string, number>;
    abTestGroup?: string;
  };

  @Column({ type: 'boolean', default: false })
  @Index()
  wasViewed: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  wasClicked: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  wasCompleted: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clickedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;
}