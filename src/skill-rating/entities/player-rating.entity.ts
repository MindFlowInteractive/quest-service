import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SkillTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
}

export enum SeasonStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  RESET = 'reset',
}

@Entity('player_ratings')
@Index(['userId', 'seasonId'])
@Index(['rating'])
@Index(['tier'])
export class PlayerRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'int', default: 1200 })
  @Index()
  rating: number;

  @Column({ type: 'int', default: 0 })
  ratingDeviation: number; // For Glicko-2 style rating confidence

  @Column({ type: 'varchar', length: 20, default: SkillTier.BRONZE })
  @Index()
  tier: SkillTier;

  @Column({ type: 'varchar', length: 50, default: 'Season 1' })
  @Index()
  seasonId: string;

  @Column({ type: 'varchar', length: 20, default: SeasonStatus.ACTIVE })
  @Index()
  seasonStatus: SeasonStatus;

  @Column({ type: 'int', default: 0 })
  gamesPlayed: number;

  @Column({ type: 'int', default: 0 })
  wins: number;

  @Column({ type: 'int', default: 0 })
  losses: number;

  @Column({ type: 'int', default: 0 })
  draws: number;

  @Column({ type: 'int', default: 0 })
  streak: number;

  @Column({ type: 'int', default: 0 })
  bestStreak: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastPlayedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastRatingUpdate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  winRate: number;

  @Column({ type: 'jsonb', default: {} })
  statistics: {
    puzzlesSolved?: number;
    averageCompletionTime?: number;
    accuracyRate?: number;
    highestRating?: number;
    lowestRating?: number;
    ratingHistory?: Array<{
      date: Date;
      rating: number;
      change: number;
      puzzleId?: string;
      difficulty?: string;
    }>;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;

  @OneToMany(() => RatingHistory, (history) => history.playerRating)
  ratingHistory: RatingHistory[];
}
