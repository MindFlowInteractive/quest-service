import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('leaderboard_entries')
@Index(['seasonId', 'rank'])
@Index(['userId'])
export class LeaderboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', default: 'current' })
  seasonId: string;

  @Column({ type: 'bigint', default: 0 })
  score: number;

  @Column({ type: 'integer', default: 0 })
  rank: number;

  @Column({ type: 'integer', default: 0 })
  wins: number;

  @Column({ type: 'integer', default: 0 })
  losses: number;

  @Column({ type: 'text', nullable: true })
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
