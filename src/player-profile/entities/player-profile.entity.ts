import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('player_profiles')
export class PlayerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string; // Foreign key to User.id

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bannerTheme?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  title?: string; // Player title/rank display

  @Column({ type: 'varchar', length: 50, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website?: string;

  @Column({ type: 'jsonb', default: [] })
  badges: string[]; // Array of badge identifiers

  @Column({ type: 'jsonb', default: {} })
  customFields: Record<string, any>; // Custom profile fields

  @Column({ type: 'jsonb', default: {} })
  socialLinks: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    github?: string;
  };

  @Column({ type: 'jsonb', default: { isProfilePublic: true, showBadges: true, showBio: true, showStats: true, showSocialLinks: true } })
  privacySettings: {
    isProfilePublic: boolean;
    showBadges: boolean;
    showBio: boolean;
    showStats: boolean;
    showSocialLinks: boolean;
    showLocation: boolean;
    showWebsite: boolean;
  };

  @Column({ type: 'jsonb', default: {} })
  displayPreferences: {
    theme?: string;
    badgeLayout?: 'grid' | 'list' | 'compact';
    showAchievementProgress?: boolean;
    profileLayout?: 'default' | 'compact' | 'detailed';
  };

  @Column({ type: 'jsonb', default: {} })
  statistics: {
    totalGamesPlayed?: number;
    totalWins?: number;
    winRate?: number;
    averageScore?: number;
    bestScore?: number;
    totalPlayTime?: number;
    favoriteCategory?: string;
    currentStreak?: number;
    longestStreak?: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
