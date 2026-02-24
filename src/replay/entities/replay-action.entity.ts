import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Represents a single action taken during puzzle solving
 * Actions are immutable once recorded
 */
@Entity('replay_actions')
@Index(['replayId', 'sequenceNumber'])
@Index(['replayId', 'timestamp'])
export class ReplayAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  replayId: string;

  @ManyToOne('PuzzleReplay', 'actions', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'replayId' })
  replay: any;

  // Sequence number for action ordering (immutable)
  @Column({ type: 'int' })
  sequenceNumber: number;

  // Type of action (move, hint, submission, etc.)
  @Column({ type: 'varchar', length: 50 })
  actionType:
    | 'MOVE'
    | 'HINT_USED'
    | 'STATE_CHANGE'
    | 'UNDO'
    | 'SUBMISSION'
    | 'PAUSE'
    | 'RESUME';

  // Timestamp relative to replay start (in milliseconds)
  @Column({ type: 'int' })
  timestamp: number;

  // Actual timestamp when action was recorded
  @CreateDateColumn()
  recordedAt: Date;

  // The action data (varies by type)
  @Column('jsonb')
  actionData: Record<string, any>;

  // Game state before this action
  @Column('jsonb', { nullable: true })
  stateBefore: Record<string, any>;

  // Game state after this action
  @Column('jsonb', { nullable: true })
  stateAfter: Record<string, any>;

  // Metadata about the action
  @Column('jsonb', { default: {} })
  metadata: {
    duration?: number; // Time spent on this action (ms)
    difficulty?: string; // Perceived difficulty
    confidence?: number; // User confidence (0-100)
    notes?: string;
  };
}
