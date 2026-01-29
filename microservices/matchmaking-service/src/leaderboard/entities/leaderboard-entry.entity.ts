import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Leaderboard } from './leaderboard.entity';

@Entity('leaderboard_entries')
export class LeaderboardEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Leaderboard)
  leaderboard: Leaderboard;

  @Column()
  userId: number;

  @Column('float')
  score: number;

  @Column({ nullable: true })
  timeTaken: number; // For time-based rankings

  @Column({ nullable: true })
  efficiency: number; // For efficiency-based rankings

  @Column({ default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 