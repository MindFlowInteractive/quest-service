import { ACHIEVEMENTS } from '../constants/achievement.constants';
import { UserProgress } from '../entities/user-progress.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

export function checkNewAchievements(
  progress: UserProgress,
  currentAchievements: UserAchievement[],
): UserAchievement[] {
  const unlockedCodes = new Set(currentAchievements.map((a) => a.achievementCode));
  const newAchievements: UserAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedCodes.has(achievement.code) && achievement.condition(progress)) {
      newAchievements.push({
        achievementCode: achievement.code,
        title: achievement.title,
        description: achievement.description,
        userId: progress.userId,
        unlockedAt: new Date(),
        progress, 
      } as UserAchievement);
    }
  }

  return newAchievements;
}
