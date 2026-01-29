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
import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tournament_participants')
@Index(['tournamentId', 'userId'], { unique: true })
@Index(['tournamentId', 'status'])
@Index(['userId', 'registeredAt'])
export class TournamentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tournamentId: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'varchar', length: 20, default: 'registered' })
  @Index()
  status:
    | 'registered'
    | 'checked-in'
    | 'active'
    | 'eliminated'
    | 'withdrawn'
    | 'disqualified';

  @Column({ type: 'int', nullable: true })
  @Index()
  seedNumber?: number; // Tournament seeding position

  @Column({ type: 'int', default: 0 })
  @Index()
  currentRound: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  draws: number;

  @Column({ type: 'int', default: 0 })
  @Index()
  totalScore: number;

  @Column({ type: 'int', nullable: true })
  @Index()
  finalPosition?: number; // 1st, 2nd, 3rd, etc.

  @Column({ type: 'int', default: 0 })
  puzzlesSolved: number;

  @Column({ type: 'int', default: 0 })
  totalPuzzlesAttempted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageAccuracy: number;

  @Column({ type: 'int', default: 0 })
  averageCompletionTime: number; // in seconds

  @Column({ type: 'int', default: 0 })
  longestWinStreak: number;

  @Column({ type: 'timestamp with time zone' })
  registeredAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  checkedInAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  eliminatedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  withdrawnAt?: Date;

  // Prize information if won
  @Column({ type: 'jsonb', nullable: true })
  prizeAwarded?: {
    amount: number;
    currency: string;
    badges?: string[];
    achievements?: string[];
    awardedAt: Date;
  };

  // Performance statistics
  @Column({ type: 'jsonb', default: {} })
  statistics: {
    matchesPlayed?: number;
    perfectScores?: number;
    comebackWins?: number;
    averageTimePerPuzzle?: number;
    bestRound?: {
      roundNumber: number;
      score: number;
    };
    worstRound?: {
      roundNumber: number;
      score: number;
    };
  };

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    entryFeePaid?: number;
    registrationIp?: string;
    teamName?: string;
    teamMembers?: string[];
    notes?: string;
  };

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tournament, (tournament) => tournament.participants)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
