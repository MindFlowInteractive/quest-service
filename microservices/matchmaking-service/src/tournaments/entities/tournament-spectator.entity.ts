import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tournament_spectators')
@Index(['tournamentId', 'userId'])
@Index(['matchId', 'userId'])
@Index(['joinedAt'])
export class TournamentSpectator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tournamentId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  matchId?: string; // Specific match being watched

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  @Column({ type: 'timestamp with time zone' })
  joinedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  leftAt?: Date;

  @Column({ type: 'int', default: 0 })
  totalWatchTime: number; // in seconds

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  // Engagement statistics
  @Column({ type: 'jsonb', default: {} })
  engagement: {
    reactionsGiven?: number;
    messagesPosted?: number;
    matchesWatched?: string[];
    favoritePlayer?: string;
    predictionsCorrect?: number;
    predictionsTotal?: number;
  };

  // Viewing preferences
  @Column({ type: 'jsonb', default: {} })
  preferences: {
    notifications?: boolean;
    followPlayer?: string;
    viewMode?: 'full' | 'compact' | 'scoreboard-only';
    chatEnabled?: boolean;
  };

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
