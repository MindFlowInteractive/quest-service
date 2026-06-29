import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Tracks which user is assigned to which variant for each experiment.
 * This allows us to know assignments without waiting for conversions.
 */
@Entity('experiment_assignments')
@Unique(['experiment_id', 'user_id']) // One assignment per user per experiment
export class ExperimentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  experiment_id: string;

  @Index()
  @Column()
  user_id: string;

  @Column()
  variant_name: string;

  @CreateDateColumn()
  assigned_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  last_converted_at: Date | null;
}