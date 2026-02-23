export class ProfileResponseDto {
  userId: string;
  username: string;
  avatarUrl?: string;
  bannerTheme?: string;
  bannerUrl?: string;
  bio?: string;
  title?: string;
  location?: string;
  website?: string;
  badges?: string[];
  customFields?: Record<string, any>;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    twitch?: string;
    youtube?: string;
    github?: string;
  };
  displayPreferences?: {
    theme?: string;
    badgeLayout?: 'grid' | 'list' | 'compact';
    showAchievementProgress?: boolean;
    profileLayout?: 'default' | 'compact' | 'detailed';
  };
  statistics?: {
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
  isProfilePublic: boolean;
  isOwner?: boolean;
}
