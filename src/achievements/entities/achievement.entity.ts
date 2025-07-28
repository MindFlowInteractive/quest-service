import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

@Entity('achievements')
@Index(['category', 'isActive'])
@Index(['rarity'])
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string; // e.g., 'puzzle_mastery', 'speed', 'consistency', 'exploration', 'social'

  @Column({ type: 'varchar', length: 20, default: 'common' })
  @Index()
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @Column({ type: 'int', default: 10 })
  points: number; // Points awarded for this achievement

  @Column({ type: 'varchar', length: 255, nullable: true })
  iconUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  badgeUrl?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSecret: boolean; // Hidden achievements

  @Column({ type: 'int', default: 0 })
  @Index()
  unlockedCount: number; // How many users have unlocked this

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  unlockRate: number; // Percentage of users who unlocked this

  // Complex unlock conditions
  @Column({ type: 'jsonb' })
  unlockConditions: {
    type: 'single' | 'multiple' | 'sequence' | 'time_based';
    conditions: Array<{
      id: string;
      type: 'puzzle_completion' | 'score_threshold' | 'time_limit' | 'streak' | 'accuracy' | 'category_mastery' | 'social' | 'custom';
      operator: 'equals' | 'greater_than' | 'less_than' | 'in_range' | 'contains';
      value: any;
      description: string;
      metadata?: any;
    }>;
    logic?: 'AND' | 'OR'; // For multiple conditions
    timeWindow?: {
      duration: number; // in seconds
      type: 'rolling' | 'fixed';
    };
  };

  // Prerequisites (other achievements that must be unlocked first)
  @Column({ type: 'simple-array', default: [] })
  prerequisites: string[]; // Achievement IDs

  // Progression tracking for multi-step achievements
  @Column({ type: 'jsonb', nullable: true })
  progression?: {
    steps: Array<{
      id: string;
      name: string;
      description: string;
      condition: any;
      points: number;
    }>;
    isCumulative: boolean; // Whether steps build on each other
  };

  // Seasonal or event-based achievements
  @Column({ type: 'jsonb', nullable: true })
  timeConstraints?: {
    startDate?: Date;
    endDate?: Date;
    recurring?: {
      type: 'daily' | 'weekly' | 'monthly' | 'yearly';
      pattern: string;
    };
    timezone?: string;
  };

  // Achievement metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    tags?: string[];
    difficulty?: number; // 1-10
    estimatedTime?: number; // minutes to complete
    relatedPuzzles?: string[];
    relatedCategories?: string[];
    tips?: string[];
    celebrationMessage?: string;
    shareText?: string;
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
  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.achievement)
  userAchievements: UserAchievement[];
}
