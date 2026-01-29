/**
 * Provides utilities to optimize the difficulty curve for player engagement.
 * Can be used to smooth out spikes and plateaus in challenge.
 */
export class DifficultyCurveOptimizer {
  /**
   * Given a sequence of puzzle difficulties and player outcomes, returns a smoothed curve.
   * Uses a moving average to avoid abrupt jumps.
   */
  static smoothDifficultyCurve(difficulties: number[], windowSize = 3): number[] {
    if (difficulties.length === 0) return [];
    const smoothed: number[] = [];
    for (let i = 0; i < difficulties.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(difficulties.length, i + Math.ceil(windowSize / 2));
      const window = difficulties.slice(start, end);
      smoothed.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    return smoothed;
  }

  /**
   * Suggests the next optimal difficulty to maximize engagement, given recent player performance.
   * If player is breezing through, increase; if struggling, decrease.
   */
  static suggestNextDifficulty(recentDifficulties: number[], recentOutcomes: boolean[]): number {
    // Simple heuristic: if last 3 are all success, increase; if all fail, decrease
    const n = Math.min(3, recentOutcomes.length);
    if (n === 0) return 3;
    const lastOutcomes = recentOutcomes.slice(-n);
    if (lastOutcomes.every((x) => x)) return Math.min(5, recentDifficulties[recentDifficulties.length - 1] + 0.5);
    if (lastOutcomes.every((x) => !x)) return Math.max(1, recentDifficulties[recentDifficulties.length - 1] - 0.5);
    // Otherwise, maintain
    return recentDifficulties[recentDifficulties.length - 1];
  }
}
