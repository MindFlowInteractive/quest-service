import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
  OneToOne, // Added OneToOne import
} from 'typeorm';
import { UserAchievement } from '../../achievements/entities/user-achievement.entity';
import { GameSession } from '../../game-engine/entities/game-session.entity';
import { UserStreak } from './user-streak.entity'; // Added import
import { UserPuzzleCompletion } from './user-puzzle-completion.entity'; // Added import

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  username: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  @Index()
  status: 'active' | 'inactive' | 'suspended' | 'deleted';

  @Column({ type: 'varchar', length: 20, default: 'player' })
  @Index()
  role: 'player' | 'admin' | 'moderator';

  @Column({ type: 'int', default: 0 })
  @Index()
  totalScore: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 0 })
  experience: number;

  @Column({ type: 'int', default: 0 })
  puzzlesSolved: number;

  @Column({ type: 'int', default: 0 })
  achievementsCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActiveAt?: Date;

  // User preferences stored as JSONB
  @Column({ type: 'jsonb', default: {} })
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    notifications?: {
      email?: boolean;
      push?: boolean;
      achievements?: boolean;
      leaderboard?: boolean;
    };
    privacy?: {
      showProfile?: boolean;
      showStats?: boolean;
      showAchievements?: boolean;
    };
    gameSettings?: {
      hintsEnabled?: boolean;
      timerEnabled?: boolean;
      soundEnabled?: boolean;
      autoSave?: boolean;
    };
  };

  // Profile metadata
  @Column({ type: 'jsonb', default: {} })
  profile: {
    bio?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      linkedin?: string;
    };
    stats?: {
      avgCompletionTime?: number;
      favoriteCategories?: string[];
      playTime?: number;
    };
  };

  // System metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: {
    registrationIp?: string;
    emailVerified?: boolean;
    emailVerifiedAt?: Date;
    loginCount?: number;
    deviceInfo?: any;
    referralCode?: string;
    referredBy?: string;
  };

  // Relationships
  @OneToMany(() => UserAchievement, (userAchievement) => userAchievement.user)
  achievements: UserAchievement[];

  @OneToMany('PuzzleProgress', 'user')
  puzzleProgress: any[];

  @OneToMany(() => GameSession, (session) => session.user)
  gameSessions: GameSession[];

  // Added relationships for streak tracking
  @OneToOne(() => UserStreak, (streak) => streak.user, { cascade: true })
  streak: UserStreak;

  @OneToMany(() => UserPuzzleCompletion, (completion) => completion.user, { cascade: true })
  puzzleCompletions: UserPuzzleCompletion[];

  @OneToMany('UserCollectionProgress', 'user')
  collectionProgress: any[];
}
