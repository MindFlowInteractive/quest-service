import { Injectable } from '@nestjs/common';

export type HintDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

/**
 * A transparent breakdown of how a hint's price was derived. Returning the
 * individual factors (rather than just a number) lets the API explain the cost
 * to the player and lets tests assert the pricing policy directly.
 */
export interface HintCostBreakdown {
  order: number;
  difficulty: HintDifficulty;
  baseCost: number;
  difficultyFactor: number;
  progressiveFactor: number;
  freeHints: number;
  totalCost: number;
}

export interface HintCostOptions {
  /** Overrides the default base unit price (defaults to 5). */
  baseCost?: number;
  /** Number of leading hints that are always free (defaults to 1). */
  freeHints?: number;
}

/** How much more expensive a hint is per difficulty band. */
export const HINT_DIFFICULTY_FACTOR: Record<HintDifficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  expert: 3,
};

/**
 * Progressive hint cost model.
 *
 * The first `freeHints` hints for a puzzle are free so a stuck player is never
 * blocked by price. After that the price grows linearly with the hint order
 * (each additional hint costs 50% more than the previous one) and is scaled by
 * the puzzle difficulty. This keeps easy puzzles cheap while making repeated
 * "give me the answer" requests on hard puzzles expensive, which is the abuse
 * control the issue asks for.
 */
@Injectable()
export class HintCostService {
  readonly defaultBaseCost = 5;
  readonly defaultFreeHints = 1;
  readonly progressiveStep = 0.5;

  computeCost(
    order: number,
    difficulty: HintDifficulty,
    options: HintCostOptions = {},
  ): HintCostBreakdown {
    const safeOrder = Math.max(1, Math.floor(Number.isFinite(order) ? order : 1));
    const baseCost = Math.max(0, options.baseCost ?? this.defaultBaseCost);
    const freeHints = Math.max(0, options.freeHints ?? this.defaultFreeHints);
    const difficultyFactor = HINT_DIFFICULTY_FACTOR[difficulty] ?? 1;

    const progressiveFactor =
      safeOrder <= freeHints ? 0 : 1 + (safeOrder - 1) * this.progressiveStep;

    const totalCost = Math.round(baseCost * difficultyFactor * progressiveFactor);

    return {
      order: safeOrder,
      difficulty,
      baseCost,
      difficultyFactor,
      progressiveFactor,
      freeHints,
      totalCost,
    };
  }

  /**
   * Cost of the whole progressive ladder for a puzzle. Useful for previewing a
   * puzzle's hint economy before a player commits.
   */
  previewSchedule(
    difficulty: HintDifficulty,
    hintCount: number,
    options: HintCostOptions = {},
  ): HintCostBreakdown[] {
    const count = Math.max(0, Math.floor(hintCount));
    const schedule: HintCostBreakdown[] = [];
    for (let order = 1; order <= count; order++) {
      schedule.push(this.computeCost(order, difficulty, options));
    }
    return schedule;
  }

  /**
   * Total price of consuming hints up to and including `order`.
   */
  cumulativeCost(
    order: number,
    difficulty: HintDifficulty,
    options: HintCostOptions = {},
  ): number {
    return this.previewSchedule(difficulty, order, options).reduce(
      (sum, entry) => sum + entry.totalCost,
      0,
    );
  }
}
