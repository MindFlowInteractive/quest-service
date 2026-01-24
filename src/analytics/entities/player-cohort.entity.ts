import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('player_cohorts')
@Index(['cohortDate', 'daysSinceInstall'])
export class PlayerCohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  playerId: string;

  @Column({ type: 'date' })
  @Index()
  cohortDate: Date; // Install date

  @Column({ type: 'int' })
  daysSinceInstall: number;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  sessionsCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}