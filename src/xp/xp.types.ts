export interface LevelThreshold {
  level: number;
  minXp: number;
}

export interface StreakMilestoneReward {
  streak: number;
  xp: number;
}

export interface LevelConfig {
  levels: LevelThreshold[];
  xpAwards: {
    puzzleSolvedByDifficulty: Record<string, number>;
    noHintsBonus: number;
    firstDailySolveBonus: number;
    streakMilestones: StreakMilestoneReward[];
  };
}

export interface LevelProgressView {
  userId: string;
  xp: number;
  level: number;
  xpToNextLevel: number;
  progressPercentage: number;
}

export interface AwardXpResult {
  awarded: boolean;
  duplicate: boolean;
  award: any;
  level: LevelProgressView;
}
