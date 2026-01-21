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

@Entity('tournament_matches')
@Index(['tournamentId', 'roundNumber'])
@Index(['tournamentId', 'status'])
@Index(['player1Id', 'player2Id'])
export class TournamentMatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tournamentId: string;

  @Column({ type: 'int' })
  @Index()
  roundNumber: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roundName?: string; // Quarter-finals, Semi-finals, Finals, etc.

  @Column({ type: 'int' })
  matchNumber: number; // Position in the round

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  @Index()
  status:
    | 'scheduled'
    | 'ready'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
    | 'no-show';

  @Column({ type: 'uuid', nullable: true })
  @Index()
  player1Id?: string; // Participant ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  player1Name?: string;

  @Column({ type: 'int', default: 0 })
  player1Score: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  player2Id?: string; // Participant ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  player2Name?: string;

  @Column({ type: 'int', default: 0 })
  player2Score: number;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  winnerId?: string; // Participant ID

  @Column({ type: 'varchar', length: 100, nullable: true })
  winnerName?: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  loserId?: string; // Participant ID

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  scheduledTime?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime?: Date;

  @Column({ type: 'int', nullable: true })
  duration?: number; // in seconds

  // Next match information for bracket progression
  @Column({ type: 'uuid', nullable: true })
  nextMatchId?: string; // For single-elimination

  @Column({ type: 'uuid', nullable: true })
  loserNextMatchId?: string; // For double-elimination (loser bracket)

  // Puzzles used in this match
  @Column({ type: 'simple-array', default: [] })
  puzzleIds: string[];

  // Match configuration
  @Column({ type: 'jsonb', default: {} })
  config: {
    bestOf?: number; // best of N puzzles
    timeLimit?: number; // seconds per puzzle
    puzzleCategory?: string;
    difficulty?: string;
  };

  // Detailed match results
  @Column({ type: 'jsonb', default: {} })
  results: {
    puzzleResults?: Array<{
      puzzleId: string;
      player1Time?: number;
      player1Score?: number;
      player1Correct?: boolean;
      player2Time?: number;
      player2Score?: number;
      player2Correct?: boolean;
      winner?: string; // participant ID
    }>;
    tiebreaker?: {
      required: boolean;
      method?: string;
      winner?: string;
    };
  };

  // Match statistics
  @Column({ type: 'jsonb', default: {} })
  statistics: {
    totalPuzzles?: number;
    player1Accuracy?: number;
    player2Accuracy?: number;
    player1AvgTime?: number;
    player2AvgTime?: number;
    spectatorCount?: number;
    peakSpectatorCount?: number;
  };

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    notes?: string;
    noShowReason?: string;
    cancelReason?: string;
    streamUrl?: string;
    replayUrl?: string;
    highlights?: string[];
  };

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tournament, (tournament) => tournament.matches)
  @JoinColumn({ name: 'tournamentId' })
  tournament: Tournament;
}
