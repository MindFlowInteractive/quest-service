import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * Tracks replay analytics for learning insights
 * Aggregated from actual replay views and comparisons
 */
@Entity('replay_analytics')
@Index(['replayId'])
@Index(['replayId', 'metricType'])
export class ReplayAnalytic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  replayId: string;

  // Metric type
  @Column({
    type: 'varchar',
    length: 50,
  })
  metricType:
    | 'VIEW'
    | 'LEARNING_EFFECTIVENESS'
    | 'STRATEGY_PATTERN'
    | 'DIFFICULTY_RATING'
    | 'COMPARISON_METRIC';

  // Metric value
  @Column('jsonb')
  metricValue: Record<string, any>;

  // Examples:
  // VIEW: { viewedAt: timestamp, viewerUserId: string }
  // LEARNING_EFFECTIVENESS: { beforeScore: number, afterScore: number, improvementRate: number }
  // STRATEGY_PATTERN: { pattern: string, frequency: number, successRate: number }
  // DIFFICULTY_RATING: { rating: 1-5, votes: number }
  // COMPARISON_METRIC: { actionDifferences: number, timingDifference: number, efficiencyGain: number }

  @CreateDateColumn()
  recordedAt: Date;
}
