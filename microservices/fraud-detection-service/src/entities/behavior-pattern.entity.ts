import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PatternType {
  ACTION_FREQUENCY = 'action_frequency',   // action rate per minute/hour
  SESSION_TIMING = 'session_timing',       // time between actions
  SCORE_PROGRESSION = 'score_progression', // score gain pattern
  LOGIN_LOCATION = 'login_location',       // geographic anomaly
  DEVICE_SWITCH = 'device_switch',         // rapid device changes
  API_ABUSE = 'api_abuse',                 // unusual API call patterns
}

@Entity('behavior_patterns')
@Index(['playerId'])
@Index(['patternType'])
@Index(['windowStart'])
export class BehaviorPattern {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'enum', enum: PatternType })
  patternType: PatternType;

  /** The raw event counts / feature vector for the window */
  @Column({ type: 'jsonb', default: {} })
  features: Record<string, number>;

  /** Mean value of the metric in this window */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  mean: number;

  /** Standard deviation of the metric in this window */
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  stdDev: number;

  /** Number of observations used to compute stats */
  @Column({ type: 'int', default: 0 })
  sampleCount: number;

  @Column({ type: 'timestamp' })
  windowStart: Date;

  @Column({ type: 'timestamp' })
  windowEnd: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
