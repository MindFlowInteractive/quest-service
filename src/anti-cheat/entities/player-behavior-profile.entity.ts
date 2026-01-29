import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';

/**
 * Entity for tracking player behavioral patterns and baselines
 * Used for anomaly detection and risk assessment
 */
@Entity('player_behavior_profiles')
@Index(['playerId'], { unique: true })
export class PlayerBehaviorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  playerId: string;

  @Column({ type: 'jsonb', default: {} })
  timingProfile: {
    avgTimeBetweenMoves: number;
    stdDevTimeBetweenMoves: number;
    fastestMove: number;
    slowestMove: number;
    typicalPausePattern: number[];
  };

  @Column({ type: 'jsonb', default: {} })
  accuracyProfile: {
    overallAccuracy: number;
    firstAttemptAccuracy: number;
    improvementRate: number;
    errorPatterns: Record<string, number>;
  };

  @Column({ type: 'jsonb', default: {} })
  skillProfile: {
    skillLevel: number;
    strongPuzzleTypes: string[];
    weakPuzzleTypes: string[];
    learningCurve: number;
    consistencyScore: number;
  };

  @Column({ type: 'jsonb', default: {} })
  sessionPatterns: {
    avgSessionDuration: number;
    puzzlesPerSession: number;
    preferredPlayTimes: string[];
    multitaskingIndicators: number;
  };

  @Column({ type: 'jsonb', default: {} })
  riskFactors: {
    overallRiskScore: number;
    flaggedBehaviors: string[];
    suspiciousPatterns: Array<{
      pattern: string;
      frequency: number;
      lastOccurrence: Date;
    }>;
  };

  @Column({ type: 'int', default: 0 })
  totalPuzzlesCompleted: number;

  @Column({ type: 'int', default: 0 })
  totalViolations: number;

  @Column({ type: 'int', default: 0 })
  confirmedViolations: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  trustScore: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastViolationAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations will be added when User entity is imported
  // @ManyToOne('User')
  // @JoinColumn({ name: 'playerId' })
  // player: any;
}
