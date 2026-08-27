/**
 * Simple content-based puzzle recommender using tag overlap scoring. (#413)
 */
export interface PuzzleProfile {
  puzzleId: string;
  tags: string[];
}

export interface ScoredRecommendation {
  puzzleId: string;
  score: number;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((tag) => setB.has(tag)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function recommendByContent(
  playerPreferredTags: string[],
  candidates: PuzzleProfile[],
  limit = 5,
): ScoredRecommendation[] {
  return candidates
    .map((puzzle) => ({
      puzzleId: puzzle.puzzleId,
      score: jaccardSimilarity(playerPreferredTags, puzzle.tags),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
