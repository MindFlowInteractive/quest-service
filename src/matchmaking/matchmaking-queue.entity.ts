// matchmaking-queue.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('matchmaking_queue')
export class MatchmakingQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  playerId: string;

  @Column()
  puzzleType: string;

  @Column()
  rating: number;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ default: 'waiting' })
  status: 'waiting' | 'matched' | 'cancelled';
}
