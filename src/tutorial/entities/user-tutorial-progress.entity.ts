import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tutorial } from './tutorial.entity';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'abandoned';
export type LearningSpeed = 'slow' | 'normal' | 'fast';
export type StepProgressStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface StepProgress {
  stepId: string;
  stepOrder: number;
  status: StepProgressStatus;
  attempts: number;
  timeSpent: number;
  score?: number;
  hintsUsed: number;
  completedAt?: Date;
  errors?: string[];
  feedback?: string;
}

export interface AdaptiveState {
  learningSpeed: LearningSpeed;
  proficiencyLevel: number;
  strugglingAreas?: string[];
  strongAreas?: string[];
  recommendedPace?: number;
  skipEligibleSteps?: string[];
  repeatRecommendedSteps?: string[];
}

export interface SessionData {
  lastSessionId?: string;
  saveState?: any;
  checkpoints?: Array<{
    stepId: string;
    state: any;
    savedAt: Date;
  }>;
}

export interface ProgressAnalytics {
  averageStepTime?: number;
  hintUsageRate?: number;
  errorRate?: number;
  retryRate?: number;
  deviceType?: string;
  browserType?: string;
}

@Entity('user_tutorial_progress')
@Index(['userId', 'tutorialId'], { unique: true })
@Index(['userId', 'status'])
@Index(['tutorialId', 'status'])
export class UserTutorialProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  tutorialId: string;

  @Column({ type: 'varchar', length: 20, default: 'not_started' })
  @Index()
  status: ProgressStatus;

  @Column({ type: 'int', default: 0 })
  currentStepOrder: number;

  @Column({ type: 'uuid', nullable: true })
  currentStepId?: string;

  @Column({ type: 'int', default: 0 })
  completedSteps: number;

  @Column({ type: 'int', default: 0 })
  totalSteps: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercentage: number;

  @Column({ type: 'int', default: 0 })
  totalTimeSpent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallScore?: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt?: Date;

  @Column({ type: 'jsonb', default: [] })
  stepProgress: StepProgress[];

  @Column({ type: 'jsonb', default: { learningSpeed: 'normal', proficiencyLevel: 0 } })
  adaptiveState: AdaptiveState;

  @Column({ type: 'jsonb', default: {} })
  sessionData: SessionData;

  @Column({ type: 'jsonb', default: {} })
  analytics: ProgressAnalytics;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Tutorial, (tutorial) => tutorial.userProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutorialId' })
  tutorial: Tutorial;
}
