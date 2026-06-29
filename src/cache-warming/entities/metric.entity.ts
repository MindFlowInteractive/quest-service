import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum MetricName {
  WARMING_RUN = 'warming_run',
  CACHE_HIT_RATE = 'cache_hit_rate',
  PRELOAD_LATENCY = 'preload_latency',
  INVALIDATION_RUN = 'invalidation_run',
  OPTIMIZATION = 'optimization',
  ERROR = 'error',
}

@Entity('metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MetricName })
  name: MetricName;

  @Column({ type: 'varchar', length: 240, nullable: true })
  cacheKey: string | null;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'varchar', length: 40, default: 'count' })
  unit: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  tags: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  windowStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  windowEnd: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
