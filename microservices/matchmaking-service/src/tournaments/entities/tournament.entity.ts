import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TournamentParticipant } from './tournament-participant.entity';
import { TournamentMatch } from './tournament-match.entity';

@Entity('tournaments')
@Index(['status', 'startTime'])
@Index(['createdBy'])
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'single-elimination' })
  @Index()
  bracketType:
    | 'single-elimination'
    | 'double-elimination'
    | 'round-robin'
    | 'swiss';

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  @Index()
  status:
    | 'scheduled'
    | 'registration'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

  @Column({ type: 'int', default: 16 })
  maxParticipants: number;

  @Column({ type: 'int', default: 0 })
  currentParticipants: number;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  registrationStartTime: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  registrationEndTime: Date;

  @Column({ type: 'timestamp with time zone' })
  @Index()
  startTime: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Index()
  endTime?: Date;

  @Column({ type: 'int', nullable: true })
  duration?: number; // in seconds

  @Column({ type: 'uuid', nullable: true })
  @Index()
  createdBy?: string; // Admin/Organizer User ID

  @Column({ type: 'uuid', nullable: true })
  winnerId?: string;

  // Entry requirements
  @Column({ type: 'jsonb', default: {} })
  entryRequirements: {
    minLevel?: number;
    minScore?: number;
    minPuzzlesSolved?: number;
    requiredAchievements?: string[];
    entryFee?: number; // points or currency
  };

  // Prize pool configuration
  @Column({ type: 'jsonb', default: {} })
  prizePool: {
    totalPrize: number;
    currency: 'points' | 'coins' | 'tokens';
    distribution: Array<{
      position: number; // 1st, 2nd, 3rd, etc.
      amount: number;
      percentage?: number;
      badges?: string[];
      achievements?: string[];
    }>;
    sponsorInfo?: {
      name: string;
      logo?: string;
    };
  };

  // Tournament configuration
  @Column({ type: 'jsonb', default: {} })
  config: {
    puzzleCategories?: string[];
    difficultyRange?: {
      min: 'easy' | 'medium' | 'hard' | 'expert';
      max: 'easy' | 'medium' | 'hard' | 'expert';
    };
    matchDuration?: number; // seconds per match
    bestOf?: number; // best of N puzzles
    autoAdvance?: boolean; // auto advance on win
    spectatorEnabled?: boolean;
    liveScoring?: boolean;
    tiebreaker?: 'time' | 'accuracy' | 'sudden-death';
  };

  // Bracket structure
  @Column({ type: 'jsonb', default: {} })
  bracket: {
    rounds: Array<{
      roundNumber: number;
      roundName: string; // Quarter-finals, Semi-finals, Finals, etc.
      matches: string[]; // Match IDs
      startTime?: Date;
      endTime?: Date;
    }>;
    totalRounds?: number;
    currentRound?: number;
  };

  // Tournament rules
  @Column({ type: 'jsonb', default: {} })
  rules: {
    noShows?: {
      waitTime: number; // seconds
      disqualifyAfter: number; // seconds
    };
    matchmaking?: {
      seedingMethod: 'random' | 'ranked' | 'seeded';
      autoMatch: boolean;
    };
    scoring?: {
      winPoints: number;
      lossPoints: number;
      drawPoints?: number;
    };
  };

  // Tags for categorization
  @Column({ type: 'simple-array', default: [] })
  @Index()
  tags: string[];

  // Statistics
  @Column({ type: 'jsonb', default: {} })
  statistics: {
    totalMatches?: number;
    completedMatches?: number;
    averageMatchDuration?: number;
    totalPuzzlesSolved?: number;
    topPerformers?: Array<{
      userId: string;
      username: string;
      score: number;
    }>;
    viewerCount?: number;
    peakViewerCount?: number;
  };

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    bannerImage?: string;
    thumbnailImage?: string;
    streamUrl?: string;
    chatEnabled?: boolean;
    recordingsEnabled?: boolean;
    highlights?: string[];
  };

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // Relations
  @OneToMany(
    () => TournamentParticipant,
    (participant) => participant.tournament,
  )
  participants: TournamentParticipant[];

  @OneToMany(() => TournamentMatch, (match) => match.tournament)
  matches: TournamentMatch[];
}
