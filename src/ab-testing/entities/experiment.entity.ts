import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  ENDED = 'ended',
}

@Entity('experiments')
export class Experiment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column('jsonb')
  variants: Array<{ name: string; description?: string }>;

  @Column('int')
  traffic_split_pct: number;

  @Column({
    type: 'enum',
    enum: ExperimentStatus,
    default: ExperimentStatus.DRAFT,
  })
  status: ExperimentStatus;

  @CreateDateColumn()
  started_at: Date;

  @Column({ nullable: true, type: 'timestamp' })
  ended_at: Date | null;
}