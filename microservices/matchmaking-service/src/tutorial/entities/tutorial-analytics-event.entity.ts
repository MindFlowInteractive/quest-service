import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type TutorialEventType =
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  | 'tutorial_abandoned'
  | 'step_started'
  | 'step_completed'
  | 'step_skipped'
  | 'step_failed'
  | 'hint_used'
  | 'error_made'
  | 'checkpoint_saved'
  | 'checkpoint_restored'
  | 'adaptive_pace_changed'
  | 'contextual_help_shown'
  | 'contextual_help_dismissed';

export interface EventPayload {
  timeSpent?: number;
  attempts?: number;
  score?: number;
  hintsUsed?: number;
  errorDetails?: any;
  userAction?: string;
  adaptiveDecision?: string;
  previousStep?: string;
  nextStep?: string;
  skipReason?: string;
  completionSummary?: {
    totalTime: number;
    totalSteps: number;
    completedSteps: number;
    overallScore: number;
  };
  deviceInfo?: {
    deviceType?: string;
    browser?: string;
    screenSize?: string;
    os?: string;
  };
  [key: string]: any;
}

@Entity('tutorial_analytics_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'tutorialId'])
@Index(['tutorialId', 'stepId'])
@Index(['sessionId'])
export class TutorialAnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  eventType: TutorialEventType;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  tutorialId?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  stepId?: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ type: 'jsonb' })
  payload: EventPayload;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;
}
