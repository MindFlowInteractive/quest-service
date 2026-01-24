import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ContextualHelpInteraction } from './contextual-help-interaction.entity';

export type TriggerContext =
  | 'puzzle_start'
  | 'hint_needed'
  | 'repeated_failure'
  | 'first_visit'
  | 'feature_discovery'
  | 'idle_timeout'
  | 'achievement_near'
  | 'custom';

export type HelpDisplayType = 'tooltip' | 'modal' | 'overlay' | 'sidebar' | 'banner';

export interface HelpContent {
  title: string;
  body: string;
  type: HelpDisplayType;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
    animationUrl?: string;
  };
  actions?: Array<{
    label: string;
    action: 'dismiss' | 'learn_more' | 'show_tutorial' | 'custom';
    targetUrl?: string;
    tutorialId?: string;
  }>;
}

export interface TriggerConditions {
  minAttempts?: number;
  maxAttempts?: number;
  timeThreshold?: number;
  errorPatterns?: string[];
  userLevel?: { min?: number; max?: number };
  hasCompletedTutorial?: boolean;
  tutorialId?: string;
}

export interface DisplayRules {
  maxShowCount?: number;
  cooldownSeconds?: number;
  showOnce?: boolean;
  dismissable?: boolean;
  autoHideAfter?: number;
}

export interface HelpLocalization {
  titleKey?: string;
  bodyKey?: string;
  actionsKeys?: Record<string, string>;
}

export interface HelpAnalytics {
  totalShown?: number;
  dismissRate?: number;
  actionTakenRate?: number;
  averageViewTime?: number;
}

@Entity('contextual_help')
@Index(['triggerContext', 'isActive'])
@Index(['targetFeature'])
@Index(['targetPuzzleType'])
export class ContextualHelp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  triggerContext: TriggerContext;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetFeature?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  targetPuzzleType?: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'jsonb' })
  content: HelpContent;

  @Column({ type: 'jsonb', default: {} })
  triggerConditions: TriggerConditions;

  @Column({ type: 'jsonb', default: {} })
  displayRules: DisplayRules;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'jsonb', default: {} })
  localization: HelpLocalization;

  @Column({ type: 'jsonb', default: {} })
  analytics: HelpAnalytics;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => ContextualHelpInteraction, (interaction) => interaction.help)
  interactions: ContextualHelpInteraction[];
}
