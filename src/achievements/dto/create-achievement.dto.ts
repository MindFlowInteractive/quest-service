import { AchievementConditionGroup } from '../types/achievement-condition.types';

export class CreateAchievementDto {
  name: string;
  description?: string;
  type: string; // e.g., 'leaderboard', 'milestone', etc.
  unlockConditions: AchievementConditionGroup;
  // Add other fields as needed
}
