import { Puzzle } from '../puzzles/entities/puzzle.entity';

/**
 * Predicts the difficulty of a new puzzle based on its features.
 * Uses heuristics; can be replaced with ML model in the future.
 */
export function predictPuzzleDifficulty(puzzle: Puzzle): number {
  // Heuristic: base on category, time limit, max hints, and content type
  let score = 1;
  if (!puzzle) return score;

  // Category-based adjustment
  if (['logic', 'math'].includes(puzzle.category)) score += 0.5;
  if (['pattern', 'spatial'].includes(puzzle.category)) score += 0.2;

  // Time limit: shorter = harder
  if (puzzle.timeLimit < 120) score += 0.5;
  else if (puzzle.timeLimit < 240) score += 0.2;

  // Max hints: fewer = harder
  if (puzzle.maxHints <= 1) score += 0.5;
  else if (puzzle.maxHints <= 2) score += 0.2;

  // Content type
  if (puzzle.content?.type === 'code' || puzzle.content?.type === 'logic-grid') score += 0.5;
  if (puzzle.content?.type === 'visual') score -= 0.2;

  // Clamp to [1, 5]
  return Math.min(Math.max(Math.round(score * 10) / 10, 1), 5);
}
