import { MILESTONES, MILESTONE_TYPES } from './milestone.constants';
import { UserProgress } from '../entities/user-progress.entity';

export function checkMilestones(progress: UserProgress): string[] {
  const notifications: string[] = [];

  for (const milestone of MILESTONES) {
    switch (milestone.type) {
      case MILESTONE_TYPES.XP:
        if (progress.xp === milestone.threshold) {
          notifications.push(milestone.message);
        }
        break;
      case MILESTONE_TYPES.PUZZLE:
        if (progress.puzzlesCompleted === milestone.threshold) {
          notifications.push(milestone.message);
        }
        break;
      case MILESTONE_TYPES.STREAK:
        if (progress.currentStreak === milestone.threshold) {
          notifications.push(milestone.message);
        }
        break;
      case MILESTONE_TYPES.ACHIEVEMENT:
        if (progress.achievements.length === milestone.threshold) {
          notifications.push(milestone.message);
        }
        break;
    }
  }

  return notifications;
}
