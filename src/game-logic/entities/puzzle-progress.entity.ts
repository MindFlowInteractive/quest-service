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

@Entity('puzzle_progress')
@Index(['userId', 'puzzleId'], { unique: true })
@Index(['userId', 'status'])
@Index(['puzzleId', 'status'])
export class PuzzleProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  puzzleId: string;

  @Column({ type: 'varchar', length: 20, default: 'not_started' })
  @Index()
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped';

  @Column({ type: 'int', default: 0 })
  @Index()
  attempts: number;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  bestScore: number;

  @Column({ type: 'int', default: 0 })
  hintsUsed: number;

  @Column({ type: 'int', default: 0 })
  timeSpent: number; // in seconds

  @Column({ type: 'int', nullable: true })
  bestTime?: number; // best completion time in seconds

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  completedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastAttemptAt?: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number; // User's rating of the puzzle (1-5)

  // Progress tracking data
  @Column({ type: 'jsonb', default: {} })
  progress: {
    currentStep?: number;
    totalSteps?: number;
    checkpoints?: any[];
    saveState?: any; // Current puzzle state for resuming
    answers?: any[]; // User's answers/attempts
    mistakes?: any[]; // Track common mistakes
  };

  // Performance metrics
  @Column({ type: 'jsonb', default: {} })
  metrics: {
    accuracy?: number; // percentage
    efficiency?: number; // score per minute
    consistency?: number; // variation in performance
    improvement?: number; // improvement over attempts
    problemAreas?: string[]; // areas where user struggled
  };

  // Session data for analytics
  @Column({ type: 'jsonb', default: {} })
  sessionData: {
    device?: string;
    browser?: string;
    screenSize?: string;
    interactions?: any[]; // click/tap events, pauses, etc.
    helpSought?: string[]; // what help was accessed
    timeBreakdown?: {
      thinking: number;
      entering: number;
      reviewing: number;
    };
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @ManyToOne('User', 'puzzleProgress', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: any;

  @ManyToOne('Puzzle', 'progress', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: any;
}
