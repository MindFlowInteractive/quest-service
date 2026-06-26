import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { ExperimentStatus } from '../interfaces/user-signal.interface';

export interface ExperimentVariant {
  key: string;
  label?: string;
  weight: number; // 0..1
  metadata?: Record<string, unknown>;
}

@Entity('ab_experiments')
@Index('idx_ab_experiment_key', ['key'], { unique: true })
@Index('idx_ab_experiment_segment', ['segmentId'])
export class AbExperiment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 180 })
  key: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  segmentId: string | null;

  @ManyToOne(() => Segment, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment | null;

  @Column({
    type: 'enum',
    enum: ExperimentStatus,
    default: ExperimentStatus.DRAFT,
  })
  status: ExperimentStatus;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  variants: ExperimentVariant[];

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  assignmentCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

/**
 * Lightweight assignment row stored in PostgreSQL for canonical records. The
 * hot-path lookup is served through Redis (`segmentation:assignment:{key}:{userId}`)
 * but persistence is kept for audit + recovery.
 */
@Entity('ab_assignments')
@Index('idx_ab_assignment_unique', ['experimentId', 'userId'], { unique: true })
@Index('idx_ab_assignment_experiment', ['experimentId'])
export class AbAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  experimentId: string;

  @ManyToOne(() => AbExperiment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'experiment_id' })
  experiment: AbExperiment;

  @Column({ type: 'varchar', length: 120 })
  userId: string;

  @Column({ type: 'varchar', length: 60 })
  variantKey: string;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;
}
