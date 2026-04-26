import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Leaderboard } from './leaderboard.entity';

@Entity('ranks')
export class Rank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leaderboardId: string;

  @ManyToOne(() => Leaderboard, (leaderboard) => leaderboard.ranks)
  @JoinColumn({ name: 'leaderboardId' })
  leaderboard: Leaderboard;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'int' })
  rank: number;

  @Column({ type: 'bigint' })
  score: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @CreateDateColumn()
  createdAt: Date;
}