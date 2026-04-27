import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AnomalyType {
  STATISTICAL_OUTLIER = 'statistical_outlier',   // z-score > threshold
  VELOCITY_SPIKE = 'velocity_spike',             // sudden burst
  IMPOSSIBLE_VALUE = 'impossible_value',         // physically impossible
  SUDDEN_SKILL_JUMP = 'sudden_skill_jump',       // skill improved too fast
  REPETITIVE_SEQUENCE = 'repetitive_sequence',   // bot-like patterns
}

@Entity('anomalies')
@Index(['playerId'])
@Index(['anomalyType'])
@Index(['detectedAt'])
export class Anomaly {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'enum', enum: AnomalyType })
  anomalyType: AnomalyType;

  @Column({ type: 'varchar', length: 100 })
  metric: string;

  /** Observed value that triggered the anomaly */
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  observedValue: number;

  /** Expected baseline value */
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  expectedValue: number;

  /** Z-score or deviation factor */
  @Column({ type: 'decimal', precision: 8, scale: 4 })
  deviationScore: number;

  /** Confidence 0–1 that this is a genuine anomaly */
  @Column({ type: 'decimal', precision: 4, scale: 3, default: 0 })
  confidence: number;

  @Column({ type: 'jsonb', default: {} })
  context: Record<string, any>;

  @Column({ type: 'timestamp' })
  detectedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
