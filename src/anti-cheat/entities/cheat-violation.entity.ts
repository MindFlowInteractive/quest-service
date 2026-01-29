import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { ViolationType, Severity, ViolationStatus, ActionType } from '../constants';

/**
 * Entity for tracking cheat violations detected in the system
 */
@Entity('cheat_violations')
@Index(['playerId', 'createdAt'])
@Index(['violationType', 'severity'])
@Index(['status', 'createdAt'])
export class CheatViolation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  puzzleId: string | null;

  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({
    type: 'enum',
    enum: ViolationType
  })
  @Index()
  violationType: ViolationType;

  @Column({
    type: 'enum',
    enum: Severity
  })
  @Index()
  severity: Severity;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  confidenceScore: number;

  @Column({ type: 'jsonb' })
  evidence: {
    detectionMethod: string;
    metrics: Record<string, any>;
    movesAnalyzed?: number;
    statisticalData?: {
      zScores?: Record<string, number>;
      populationComparison?: any;
      baseline?: any;
    };
    flaggedMoves?: string[];
    timestamps?: Date[];
    anomalies?: Array<{
      type: string;
      severity: string;
      description: string;
      value?: any;
    }>;
    additionalContext?: Record<string, any>;
  };

  @Column({
    type: 'enum',
    enum: ViolationStatus,
    default: ViolationStatus.PENDING
  })
  @Index()
  status: ViolationStatus;

  @Column({ type: 'boolean', default: false })
  autoDetected: boolean;

  @Column({ type: 'boolean', default: false })
  actionTaken: boolean;

  @Column({ type: 'jsonb', nullable: true })
  actionDetails: {
    actionType: ActionType;
    appliedAt: Date;
    appliedBy?: string;
    duration?: number;
    expiresAt?: Date;
    notes?: string;
  } | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations will be added when User and Puzzle entities are imported
  // @ManyToOne('User', 'cheatViolations')
  // @JoinColumn({ name: 'playerId' })
  // player: any;

  // @ManyToOne('Puzzle', { nullable: true })
  // @JoinColumn({ name: 'puzzleId' })
  // puzzle?: any;

  // @OneToMany('CheatAppeal', 'violation')
  // appeals: CheatAppeal[];
}
