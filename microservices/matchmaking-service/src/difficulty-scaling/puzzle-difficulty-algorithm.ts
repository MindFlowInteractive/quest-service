import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../puzzles/entities/puzzle-rating.entity';

/**
 * Calculates a difficulty score for a puzzle based on its stats and ratings.
 * Returns a value from 1 (easy) to 5 (hard).
 */
export function calculatePuzzleDifficulty(puzzle: Puzzle | null, ratings: PuzzleRating[]): number {
  if (!puzzle) return 1;
  // Use completion rate, average completion time, and user difficulty votes
  const completionRate = puzzle.analytics?.completionRate ?? (puzzle.completions / Math.max(1, puzzle.attempts));
  const avgTime = puzzle.averageCompletionTime || 0;
  // User votes
  const votes: Record<string, number> = { easy: 0, medium: 0, hard: 0, expert: 0 };
  for (const r of ratings) {
    if (r.difficultyVote && votes.hasOwnProperty(r.difficultyVote)) {
      votes[r.difficultyVote]!++;
    }
  }
  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
  // Weighted difficulty from votes
  const voteScore = (votes.easy * 1 + votes.medium * 2 + votes.hard * 3 + votes.expert * 4) / totalVotes;
  // Normalize metrics
  const normCompletion = 1 - Math.min(completionRate, 1); // harder if fewer complete
  const normTime = Math.min(Math.max((avgTime - 60) / 540, 0), 1); // 60s fast, 600s slow
  // Weighted sum (tune weights as needed)
  const difficulty = 1 + 4 * (0.4 * normCompletion + 0.3 * normTime + 0.3 * (voteScore / 4));
  return Math.round(difficulty * 10) / 10;
}
