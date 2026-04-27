import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Rank } from './rank.entity';

export enum LeaderboardCategory {
  SCORE = 'score',
  WINS = 'wins',
  STREAK = 'streak',
  ACHIEVEMENTS = 'achievements',
}

export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ALL_TIME = 'all_time',
}

@Entity('leaderboards')
export class Leaderboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'enum', enum: LeaderboardCategory })
  category: LeaderboardCategory;

  @Column({ type: 'enum', enum: TimePeriod })
  timePeriod: TimePeriod;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Rank, (rank) => rank.leaderboard)
  ranks: Rank[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}