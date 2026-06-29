import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TournamentEventParticipant } from './tournament-event-participant.entity';

@Entity('tournament_events')
@Index(['status', 'startAt'])
export class TournamentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startAt: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  endAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  @Index()
  status: 'draft' | 'upcoming' | 'active' | 'completed';

  @Column({ type: 'int', default: 100 })
  maxParticipants: number;

  @Column('uuid', { array: true, default: [] })
  puzzleIds: string[];

  @Column({ type: 'jsonb', default: {} })
  rewardPool: {
    totalPrize?: number;
    currency?: 'points' | 'coins' | 'tokens';
    distribution?: Array<{
      position: number; // 1st, 2nd, 3rd, etc.
      amount: number;
      percentage?: number;
      badges?: string[];
      achievements?: string[];
    }>;
  };

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  createdBy?: string; // Admin User ID

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column({ type: 'jsonb', default: {} })
  finalStandings: {
    rankings: Array<{
      userId: string;
      username: string;
      totalScore: number;
      position: number;
      puzzlesSolved: number;
    }>;
    computedAt?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => TournamentEventParticipant, participant => participant.tournamentEvent)
  participants: TournamentEventParticipant[];
}