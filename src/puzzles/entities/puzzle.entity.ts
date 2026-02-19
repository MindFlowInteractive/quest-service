import { Events } from 'src/event/entities/event.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';

@Entity('puzzles')
@Index(['category', 'difficulty'])
@Index(['isActive', 'publishedAt'])
@Index(['createdBy'])
export class Puzzle {
  @Column({ type: 'timestamp with time zone', nullable: true })
  archivedAt?: Date;
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string; // e.g., 'logic', 'math', 'pattern', 'word', 'spatial'

  @Column({ type: 'varchar', length: 20, default: 'medium' })
  @Index()
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @Column({ type: 'int', default: 1 })
  @Index()
  difficultyRating: number; // 1-10 scale

  @Column({ type: 'int', default: 100 })
  basePoints: number;

  @Column({ type: 'int', default: 300 })
  timeLimit: number; // in seconds

  @Column({ type: 'int', default: 3 })
  maxHints: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  attempts: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  completions: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Index()
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'int', default: 0 })
  averageCompletionTime: number; // in seconds

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  @Index()
  isFeatured: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  publishedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  createdBy?: string; // User ID who created the puzzle

  // Puzzle content and configuration
  @Column({ type: 'jsonb' })
  content: {
    type: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'code' | 'visual' | 'logic-grid';
    question?: string;
    options?: string[];
    correctAnswer?: any;
    explanation?: string;
    media?: {
      images?: string[];
      videos?: string[];
      audio?: string[];
    };
    interactive?: {
      components?: any[];
      rules?: any;
      initialState?: any;
    };
  };

  // Hints configuration
  @Column({ type: 'jsonb', default: [] })
  hints: Array<{
    order: number;
    text: string;
    pointsPenalty: number;
    unlockAfter?: number; // seconds
  }>;

  // Tags for categorization and search
  @Column({ type: 'simple-array', default: [] })
  @Index()
  tags: string[];

  // Prerequisites (other puzzle IDs that should be completed first)
  @Column({ type: 'jsonb', default: [] })
  prerequisites: string[];

  // Scoring configuration
  @Column({ type: 'jsonb', default: {} })
  scoring: {
    timeBonus?: {
      enabled: boolean;
      maxBonus: number;
      baseTime: number;
    };
    accuracyBonus?: {
      enabled: boolean;
      maxBonus: number;
    };
    streakBonus?: {
      enabled: boolean;
      multiplier: number;
    };
  };

  // Analytics and metadata
  @Column({ type: 'jsonb', default: {} })
  analytics: {
    completionRate?: number;
    averageAttempts?: number;
    commonErrors?: string[];
    timeDistribution?: {
      min: number;
      max: number;
      median: number;
      q1: number;
      q3: number;
    };
  };

  // Admin metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    version?: string;
    lastModifiedBy?: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewNotes?: string;
    source?: string;
    license?: string;
    difficulty_votes?: {
      easy: number;
      medium: number;
      hard: number;
      expert: number;
    };
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
  @OneToMany('PuzzleProgress', 'puzzle')
  progress: any[];

  // Self-referencing relationship for puzzle series or collections
  @ManyToOne(() => Puzzle, { nullable: true })
  @JoinColumn({ name: 'parentPuzzleId' })
  parentPuzzle?: Puzzle;

  @OneToMany(() => Puzzle, (puzzle) => puzzle.parentPuzzle)
  childPuzzles: Puzzle[];

  @ManyToMany('Category', 'puzzles')
  categories: any[];

  @ManyToMany('Collection', 'puzzles')
  collections: any[];

  @ManyToOne(() => Events, event => event.puzzles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: number;

}
