import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RuleConditionOperator {
  GT = 'gt',   // greater than
  LT = 'lt',   // less than
  GTE = 'gte',
  LTE = 'lte',
  EQ = 'eq',
  NEQ = 'neq',
  IN = 'in',
}

export enum RuleAction {
  ALERT = 'alert',
  FLAG = 'flag',
  SUSPEND = 'suspend',
  THROTTLE = 'throttle',
  REQUIRE_REVIEW = 'require_review',
}

@Entity('fraud_rules')
@Index(['isActive'])
@Index(['priority'])
export class FraudRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** The metric or field to evaluate (e.g. "actionsPerMinute", "scoreGainPerSession") */
  @Column({ type: 'varchar', length: 100 })
  metric: string;

  @Column({ type: 'enum', enum: RuleConditionOperator })
  operator: RuleConditionOperator;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  threshold: number;

  @Column({ type: 'enum', enum: RuleAction })
  action: RuleAction;

  /** 0–100 risk points added when this rule fires */
  @Column({ type: 'int', default: 20 })
  riskPoints: number;

  /** Higher priority rules are evaluated first */
  @Column({ type: 'int', default: 50 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
