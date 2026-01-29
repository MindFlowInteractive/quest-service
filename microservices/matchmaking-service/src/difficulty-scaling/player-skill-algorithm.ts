import { UserStats } from '../users/entities/user-stats.entity';

/**
 * Calculates a player skill score based on their stats.
 * Returns a value from 1 (easy) to 5 (hard).
 */
export function calculatePlayerSkill(stats: UserStats | null): number {
  // Example algorithm: weighted average of accuracy, completion, and time
  if (!stats) return 1;
  const accuracy = Number(stats.overallAccuracy) || 0;
  const completionRate = stats.totalPuzzlesCompleted / Math.max(1, stats.totalPuzzlesAttempted);
  const avgTime = Number(stats.averageCompletionTime) || 0;

  // Normalize metrics
  const normAccuracy = Math.min(accuracy / 100, 1);
  const normCompletion = Math.min(completionRate, 1);
  // Assume 60s is fast, 600s is slow
  const normTime = 1 - Math.min(Math.max((avgTime - 60) / 540, 0), 1);

  // Weighted sum (tune weights as needed)
  const skill = 1 + 4 * (0.5 * normAccuracy + 0.3 * normCompletion + 0.2 * normTime);
  return Math.round(skill * 10) / 10;
}
