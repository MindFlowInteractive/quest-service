import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum TargetCohort {
  ALL = 'all',
  PREMIUM = 'premium',
  NEW_USERS = 'new_users',
}

@Entity('feature_flags')
export class FeatureFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ default: false })
  enabled: boolean;

  @Column('int', { default: 100 })
  rollout_pct: number;

  @Column({
    type: 'enum',
    enum: TargetCohort,
    default: TargetCohort.ALL,
  })
  target_cohort: TargetCohort;
}