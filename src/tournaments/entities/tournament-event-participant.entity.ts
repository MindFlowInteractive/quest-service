import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TournamentEvent } from './tournament-event.entity';

@Entity('tournament_event_participants')
@Index(['tournamentEventId', 'userId'])
@Index(['userId'])
export class TournamentEventParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tournamentEventId: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 20, default: 'registered' })
  status: 'registered' | 'active' | 'completed' | 'disqualified';

  @Column({ type: 'float', default: 0 })
  totalScore: number;

  @Column({ type: 'int', default: 0 })
  puzzlesSolved: number;

  @Column({ type: 'int', nullable: true })
  finalPosition?: number;

  @Column({ type: 'jsonb', default: {} })
  prizeAwarded?: {
    amount?: number;
    currency?: string;
    badges?: string[];
    achievements?: string[];
  };

  @Column({ type: 'jsonb', default: [] })
  puzzleResults: Array<{
    puzzleId: string;
    score: number;
    completedAt: Date;
    timeTaken?: number;
  }>;

  @CreateDateColumn()
  registeredAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TournamentEvent, tournamentEvent => tournamentEvent.participants)
  @JoinColumn({ name: 'tournamentEventId' })
  tournamentEvent: TournamentEvent;
}