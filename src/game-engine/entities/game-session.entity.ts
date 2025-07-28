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

@Entity('game_sessions')
@Index(['userId', 'startTime'])
@Index(['sessionId'], { unique: true })
@Index(['userId', 'isActive'])
@Index(['endTime'])
export class GameSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  sessionId: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'web' })
  @Index()
  platform: 'web' | 'mobile' | 'tablet' | 'desktop';

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceInfo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  browserInfo?: string;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  endTime?: Date;

  @Column({ type: 'int', default: 0 })
  duration: number; // in seconds

  @Column({ type: 'int', default: 0 })
  @Index()
  puzzlesAttempted: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  puzzlesCompleted: number;

  @Column({ type: 'int', default: 0 })
  puzzlesFailed: number;

  @Column({ type: 'int', default: 0 })
  puzzlesSkipped: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  totalHintsUsed: number;

  @Column({ type: 'int', default: 0 })
  achievementsUnlocked: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageAccuracy: number;

  @Column({ type: 'int', default: 0 })
  longestStreak: number;

  @Column({ type: 'simple-array', default: [] })
  puzzleIds: string[];

  @Column({ type: 'simple-array', default: [] })
  categoriesPlayed: string[];

  // Detailed session analytics
  @Column({ type: 'jsonb', default: {} })
  analytics: {
    performanceMetrics?: {
      averageTimePerPuzzle?: number;
      accuracyByCategory?: Record<string, number>;
      difficultyProgression?: string[];
      skillImprovementRate?: number;
    };
    behaviorMetrics?: {
      pauseCount?: number;
      totalPauseTime?: number;
      averageThinkingTime?: number;
      helpSeekingBehavior?: {
        hintsRequested?: number;
        hintsPerPuzzle?: number;
        helpTopics?: string[];
      };
    };
    engagementMetrics?: {
      focusLoss?: number; // times user left/returned
      interactionRate?: number; // actions per minute
      frustrationIndicators?: string[];
      satisfactionScore?: number;
    };
  };

  // Session configuration and context
  @Column({ type: 'jsonb', default: {} })
  sessionConfig: {
    gameMode?: 'practice' | 'challenge' | 'timed' | 'zen';
    difficultyFilter?: string[];
    categoryFilter?: string[];
    timeLimit?: number;
    hintsEnabled?: boolean;
    soundEnabled?: boolean;
    theme?: string;
  };

  // Real-time session state (for resuming)
  @Column({ type: 'jsonb', default: {} })
  sessionState: {
    currentPuzzleId?: string;
    currentPuzzleState?: any;
    queuedPuzzles?: string[];
    completedPuzzles?: Array<{
      id: string;
      score: number;
      time: number;
      attempts: number;
      hintsUsed: number;
    }>;
    userPreferences?: any;
    temporaryProgress?: any;
  };

  // Location and context data
  @Column({ type: 'jsonb', default: {} })
  contextData: {
    ipAddress?: string;
    country?: string;
    timezone?: string;
    referrer?: string;
    campaignSource?: string;
    experimentGroups?: string[];
    sessionTags?: string[];
  };

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, default: 'ongoing' })
  @Index()
  status: 'ongoing' | 'completed' | 'abandoned' | 'paused' | 'error';

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.gameSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
