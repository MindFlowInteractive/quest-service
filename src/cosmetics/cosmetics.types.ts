/**
 * Kinds of cosmetic a player can own. Each kind is also an equip slot, so a
 * player shows at most one title, one avatar frame, and so on.
 */
export enum CosmeticType {
  TITLE = 'title',
  AVATAR_FRAME = 'avatar_frame',
  NAME_COLOR = 'name_color',
  PROFILE_BADGE = 'profile_badge',
}

/** What a player has to reach before a cosmetic unlocks. */
export enum UnlockConditionType {
  /** Reach player level `threshold` */
  LEVEL = 'level',
  /** Earn `threshold` total XP */
  TOTAL_XP = 'total_xp',
  /** Solve `threshold` puzzles */
  PUZZLES_SOLVED = 'puzzles_solved',
  /** Hold a daily streak of `threshold` days */
  STREAK_DAYS = 'streak_days',
  /** Unlock the achievement `achievementId` */
  ACHIEVEMENT = 'achievement',
  /** Never unlocks automatically, only through a grant */
  MANUAL = 'manual',
}

export interface UnlockCondition {
  type: UnlockConditionType;
  threshold?: number;
  achievementId?: string;
}

/**
 * Milestone numbers used to check unlock conditions. Callers send whatever
 * they know; a condition whose number is missing is treated as not met.
 */
export interface PlayerMilestoneStats {
  level?: number;
  totalXp?: number;
  puzzlesSolved?: number;
  streakDays?: number;
  achievementIds?: string[];
}
