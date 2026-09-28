export interface PlayerStats {
  playerId: string;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  winRate: number; // Percentage
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  personalBestScore: number;
  lastActiveDate: string; // YYYY-MM-DD
  customStats: Record<string, number>;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'games' | 'wins' | 'score' | 'streak';
  targetValue: number;
  rewardXp: number;
}

export interface PlayerAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isUnlocked: boolean;
}

export interface PlayerStatHistory {
  id: string;
  playerId: string;
  metric: string;
  delta: number;
  newValue: number;
  timestamp: string;
}

export interface AchievementAnalytics {
  totalAchievementsAvailable: number;
  totalUnlocked: number;
  unlockRatePercentage: number;
  categoryBreakdown: Record<string, number>;
}