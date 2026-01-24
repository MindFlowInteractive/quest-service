import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContextualHelp } from './contextual-help.entity';

export type InteractionAction = 'shown' | 'dismissed' | 'clicked' | 'completed' | 'auto_hidden';

export interface InteractionContext {
  puzzleId?: string;
  sessionId?: string;
  currentStep?: string;
  errorState?: string;
  deviceInfo?: {
    deviceType?: string;
    browser?: string;
    screenSize?: string;
  };
}

@Entity('contextual_help_interactions')
@Index(['userId', 'helpId'])
@Index(['userId', 'triggerContext'])
@Index(['helpId', 'action'])
export class ContextualHelpInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'uuid' })
  @Index()
  helpId: string;

  @Column({ type: 'varchar', length: 50 })
  triggerContext: string;

  @Column({ type: 'varchar', length: 20 })
  action: InteractionAction;

  @Column({ type: 'int', nullable: true })
  viewDuration?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actionTaken?: string;

  @Column({ type: 'jsonb', nullable: true })
  context?: InteractionContext;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  @ManyToOne(() => ContextualHelp, (help) => help.interactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'helpId' })
  help: ContextualHelp;
}
