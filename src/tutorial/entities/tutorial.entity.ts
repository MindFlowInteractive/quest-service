import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TutorialStep } from './tutorial-step.entity';
import { UserTutorialProgress } from './user-tutorial-progress.entity';

export type TutorialType = 'onboarding' | 'mechanic' | 'advanced' | 'refresher';
export type DifficultyLevel = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export interface TutorialMetadata {
  version?: string;
  tags?: string[];
  targetAudience?: string[];
  unlockConditions?: {
    minLevel?: number;
    requiredAchievements?: string[];
    completedTutorials?: string[];
  };
  rewardsOnCompletion?: {
    xp?: number;
    achievementId?: string;
    unlockedFeatures?: string[];
  };
}

export interface TutorialAnalytics {
  totalStarted?: number;
  totalCompleted?: number;
  averageCompletionTime?: number;
  dropOffRate?: number;
  lastCalculatedAt?: Date;
}

@Entity('tutorials')
@Index(['type', 'isActive'])
@Index(['difficultyLevel', 'order'])
@Index(['category'])
export class Tutorial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'onboarding' })
  @Index()
  type: TutorialType;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string;

  @Column({ type: 'varchar', length: 20, default: 'easy' })
  @Index()
  difficultyLevel: DifficultyLevel;

  @Column({ type: 'int', default: 0 })
  @Index()
  order: number;

  @Column({ type: 'int', default: 0 })
  estimatedDurationMinutes: number;

  @Column({ type: 'simple-array', default: '' })
  prerequisites: string[];

  @Column({ type: 'simple-array', default: '' })
  targetMechanics: string[];

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSkippable: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: TutorialMetadata;

  @Column({ type: 'jsonb', default: {} })
  analytics: TutorialAnalytics;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date;

  @OneToMany(() => TutorialStep, (step) => step.tutorial)
  steps: TutorialStep[];

  @OneToMany(() => UserTutorialProgress, (progress) => progress.tutorial)
  userProgress: UserTutorialProgress[];
}
