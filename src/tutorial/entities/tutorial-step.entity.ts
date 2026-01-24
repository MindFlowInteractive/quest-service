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

export type StepType = 'instruction' | 'interactive' | 'practice' | 'quiz' | 'demonstration' | 'checkpoint';

export interface StepContent {
  instructions: string;
  richContent?: {
    markdown?: string;
    html?: string;
  };
  media?: {
    images?: Array<{ url: string; alt: string; caption?: string }>;
    videos?: Array<{ url: string; caption?: string; duration?: number }>;
    animations?: Array<{ url: string; type: string }>;
  };
  highlights?: Array<{
    elementSelector: string;
    description: string;
    action?: 'click' | 'hover' | 'focus';
  }>;
  tooltips?: Array<{
    target: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  }>;
}

export interface InteractiveConfig {
  type: 'drag-drop' | 'click-sequence' | 'input' | 'selection' | 'puzzle-mini';
  config: Record<string, any>;
  expectedOutcome: any;
  hints?: string[];
  maxAttempts?: number;
}

export interface CompletionCriteria {
  type: 'auto' | 'action' | 'quiz' | 'time' | 'manual';
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }>;
  minimumScore?: number;
  requiredActions?: string[];
}

export interface AdaptivePacing {
  minTimeOnStep?: number;
  skipIfProficient?: boolean;
  proficiencyThreshold?: number;
  repeatIfStrugglingThreshold?: number;
  adaptiveHints?: boolean;
}

export interface StepAccessibility {
  ariaLabel?: string;
  screenReaderText?: string;
  keyboardShortcuts?: Record<string, string>;
  reducedMotionAlternative?: any;
  highContrastSupport?: boolean;
}

export interface StepLocalization {
  titleKey?: string;
  instructionsKey?: string;
  contentKeys?: Record<string, string>;
}

export interface StepAnalytics {
  averageTimeSpent?: number;
  completionRate?: number;
  hintUsageRate?: number;
  commonErrors?: string[];
}

@Entity('tutorial_steps')
@Index(['tutorialId', 'order'])
@Index(['type', 'isActive'])
export class TutorialStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tutorialId: string;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 20 })
  type: StepType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isOptional: boolean;

  @Column({ type: 'int', nullable: true })
  timeLimit?: number;

  @Column({ type: 'jsonb' })
  content: StepContent;

  @Column({ type: 'jsonb', nullable: true })
  interactive?: InteractiveConfig;

  @Column({ type: 'jsonb', default: {} })
  completionCriteria: CompletionCriteria;

  @Column({ type: 'jsonb', default: {} })
  adaptivePacing: AdaptivePacing;

  @Column({ type: 'jsonb', default: {} })
  localization: StepLocalization;

  @Column({ type: 'jsonb', default: {} })
  accessibility: StepAccessibility;

  @Column({ type: 'jsonb', default: {} })
  analytics: StepAnalytics;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Tutorial, (tutorial) => tutorial.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tutorialId' })
  tutorial: Tutorial;
}
