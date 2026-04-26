import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('experiment_conversions')
export class ExperimentConversion {
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

  @Column()
  event_type: string;

  @CreateDateColumn()
  created_at: Date;
}