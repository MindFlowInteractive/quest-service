import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_stats')
@Index(['userId'], { unique: true })
export class UserStats {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  // Overall Statistics
  @Column({ type: 'int', default: 0 })
  @Index()
  totalPuzzlesAttempted: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  totalPuzzlesCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalPuzzlesFailed: number;

  @Column({ type: 'int', default: 0 })
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  totalTimeSpent: number; // in seconds

  @Column({ type: 'int', default: 0 })
  totalHintsUsed: number;

  @Column({ type: 'int', default: 0 })
  currentStreak: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  longestStreak: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @Index()
  overallAccuracy: number; // percentage

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageCompletionTime: number; // seconds

  @Column({ type: 'int', default: 0 })
  totalAchievements: number;

  @Column({ type: 'int', default: 0 })
  totalGameSessions: number;

  // Difficulty-based Statistics
  @Column({ type: 'jsonb', default: {} })
  difficultyStats: {
    easy?: {
      attempted: number;
      completed: number;
      accuracy: number;
      averageTime: number;
      bestTime: number;
    };
    medium?: {
      attempted: number;
      completed: number;
      accuracy: number;
      averageTime: number;
      bestTime: number;
    };
    hard?: {
      attempted: number;
      completed: number;
      accuracy: number;
      averageTime: number;
      bestTime: number;
    };
    expert?: {
      attempted: number;
      completed: number;
      accuracy: number;
      averageTime: number;
      bestTime: number;
    };
  };

  // Category-based Statistics
  @Column({ type: 'jsonb', default: {} })
  categoryStats: Record<string, {
    attempted: number;
    completed: number;
    accuracy: number;
    averageTime: number;
    bestScore: number;
    mastery: number; // 0-100 percentage
  }>;

  // Time-based Statistics
  @Column({ type: 'jsonb', default: {} })
  timeStats: {
    daily?: {
      averagePlayTime: number;
      averagePuzzles: number;
      bestDay: string;
      streakDays: number;
    };
    weekly?: {
      averagePlayTime: number;
      averagePuzzles: number;
      bestWeek: string;
      activeWeeks: number;
    };
    monthly?: {
      averagePlayTime: number;
      averagePuzzles: number;
      bestMonth: string;
      activeMonths: number;
    };
  };

  // Performance Trends
  @Column({ type: 'jsonb', default: {} })
  trends: {
    skillProgression?: {
      currentLevel: number;
      experiencePoints: number;
      nextLevelProgress: number;
      skillAreas: Record<string, number>;
    };
    recentPerformance?: Array<{
      date: string;
      score: number;
      accuracy: number;
      puzzlesCompleted: number;
    }>;
    improvements?: {
      speedImprovement: number; // percentage
      accuracyImprovement: number; // percentage
      consistencyScore: number; // 0-100
    };
  };

  // Milestone Tracking
  @Column({ type: 'jsonb', default: {} })
  milestones: {
    firstPuzzleCompleted?: Date;
    first100Points?: Date;
    first1000Points?: Date;
    firstPerfectScore?: Date;
    longestSession?: {
      duration: number;
      date: Date;
    };
    personalBests?: {
      fastestCompletion: {
        time: number;
        puzzleId: string;
        date: Date;
      };
      highestScore: {
        score: number;
        puzzleId: string;
        date: Date;
      };
    };
  };

  // Rankings and Comparisons
  @Column({ type: 'jsonb', default: {} })
  rankings: {
    globalRank?: number;
    categoryRanks?: Record<string, number>;
    percentile?: number; // 0-100, higher is better
    leaderboardPositions?: Array<{
      leaderboardId: string;
      position: number;
      lastUpdated: Date;
    }>;
  };

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  lastActivityAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  lastCalculatedAt?: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
