import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
@Index(['userId', 'achievementId'], { unique: true })
@Index(['userId', 'unlockedAt'])
@Index(['achievementId', 'unlockedAt'])
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  achievementId: string;

  @Column({ type: 'int', default: 0 })
  progress: number; // For multi-step achievements

  @Column({ type: 'int', default: 100 })
  progressTotal: number; // Total progress needed

  @Column({ type: 'boolean', default: false })
  @Index()
  isUnlocked: boolean;

  @Column({ type: 'boolean', default: false })
  isNotified: boolean; // Whether user has been notified

  @Column({ type: 'boolean', default: false })
  isViewed: boolean; // Whether user has viewed the achievement

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  unlockedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  notifiedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  viewedAt?: Date;

  // Context about how the achievement was unlocked
  @Column({ type: 'jsonb', default: {} })
  unlockContext: {
    triggerEvent?: string; // What action triggered the unlock
    puzzleId?: string; // If unlocked from a specific puzzle
    sessionId?: string; // Game session where it was unlocked
    score?: number; // User's score when unlocked
    metadata?: any; // Additional context data
  };

  // Current progress details for multi-step achievements
  @Column({ type: 'jsonb', default: {} })
  progressDetails: {
    stepsCompleted?: string[];
    currentStep?: string;
    stepProgress?: Record<string, number>;
    milestones?: Array<{
      step: string;
      completedAt: Date;
      value: any;
    }>;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.achievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;
} 