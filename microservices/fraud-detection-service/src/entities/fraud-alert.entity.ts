import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
}

export enum AlertType {
  VELOCITY = 'velocity',         // too many actions in short time
  IMPOSSIBLE_SCORE = 'impossible_score',
  MULTI_ACCOUNT = 'multi_account',
  BOT_BEHAVIOR = 'bot_behavior',
  EXPLOIT = 'exploit',
  PAYMENT_FRAUD = 'payment_fraud',
  ANOMALY = 'anomaly',
  RULE_VIOLATION = 'rule_violation',
}

@Entity('fraud_alerts')
@Index(['playerId'])
@Index(['status'])
@Index(['severity'])
@Index(['createdAt'])
export class FraudAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity, default: AlertSeverity.MEDIUM })
  severity: AlertSeverity;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.OPEN })
  status: AlertStatus;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: {} })
  evidence: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'text', nullable: true })
  reviewNote?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
