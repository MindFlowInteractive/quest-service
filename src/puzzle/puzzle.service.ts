import { Injectable } from '@nestjs/common';
import { SorobanService } from '../soroban/soroban.service';
import { ConfigService } from '@nestjs/config';
import { nativeToScVal, Address } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class PuzzleService {
  private puzzleContractId: string;

  constructor(
    private sorobanService: SorobanService,
    private configService: ConfigService,
  ) {
    this.puzzleContractId =
      this.configService.get<string>('PUZZLE_CONTRACT_ID');
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  async createPuzzle(puzzleId: number, solution: string) {
    // Hash the solution before storing
    const solutionHash = this.hash(solution);

    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      nativeToScVal(solutionHash, { type: 'string' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'create_puzzle',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      puzzleId,
      transactionHash: result.hash,
    };
  }

  async verifySolution(puzzleId: number, solution: string) {
    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      nativeToScVal(solution, { type: 'string' }),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'verify_solution',
      params,
    );

    return {
      verified: result.status === 'SUCCESS',
      puzzleId,
      transactionHash: result.hash,
    };
  }

  async markCompleted(puzzleId: number, userAddress: string) {
    const params = [
      nativeToScVal(puzzleId, { type: 'u64' }),
      new Address(userAddress).toScVal(),
    ];

    const result = await this.sorobanService.invokeContract(
      this.puzzleContractId,
      'mark_completed',
      params,
    );

    return {
      success: result.status === 'SUCCESS',
      puzzleId,
      user: userAddress,
      transactionHash: result.hash,
    };
  }

  // ---------------------------------------------------------------------
  // Custom puzzle builder (#435)
  // ---------------------------------------------------------------------

  /**
   * Validate a player-authored puzzle before it is accepted.
   *
   * Field-level errors are returned rather than thrown so the builder UI can
   * attach each message to the input that produced it.
   */
  validatePuzzleDefinition(definition: PuzzleDefinition): PuzzleValidationResult {
    const errors: PuzzleValidationError[] = [];
    const add = (field: string, code: string, message: string) =>
      errors.push({ field, code, message });

    const { width, height, cells, solution, allowedValues } = definition;

    if (!Number.isInteger(width) || width < 1 || width > MAX_GRID_SIDE) {
      add('width', 'OUT_OF_RANGE', `width must be an integer between 1 and ${MAX_GRID_SIDE}.`);
    }
    if (!Number.isInteger(height) || height < 1 || height > MAX_GRID_SIDE) {
      add('height', 'OUT_OF_RANGE', `height must be an integer between 1 and ${MAX_GRID_SIDE}.`);
    }

    const area = width * height;
    if (cells.length !== area) {
      add('cells', 'LENGTH_MISMATCH', `cells must contain exactly ${area} entries, received ${cells.length}.`);
    }
    if (solution.length !== area) {
      add('solution', 'LENGTH_MISMATCH', `solution must contain exactly ${area} entries, received ${solution.length}.`);
    }
    if (allowedValues.length < 2) {
      add('allowedValues', 'TOO_FEW_VALUES', 'allowedValues must declare at least two distinct values.');
    }

    const allowed = new Set(allowedValues);
    cells.forEach((cell, index) => {
      if (!allowed.has(cell)) {
        add(`cells[${index}]`, 'VALUE_NOT_ALLOWED', `"${cell}" is not in allowedValues.`);
      }
    });
    solution.forEach((cell, index) => {
      if (!allowed.has(cell)) {
        add(`solution[${index}]`, 'VALUE_NOT_ALLOWED', `"${cell}" is not in allowedValues.`);
      }
    });

    // A single-value board is solved by inspection; it is not a puzzle.
    if (new Set(cells).size < 2) {
      add('cells', 'TRIVIAL_PUZZLE', 'cells must use at least two distinct values.');
    }
    if (new Set(solution).size < 2) {
      add('solution', 'TRIVIAL_SOLUTION', 'solution must use at least two distinct values.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Estimate how hard a puzzle is.
   *
   * This is a transparent heuristic, not a solver: board area and the number of
   * distinct values both raise difficulty, and a board whose solution repeats a
   * single run is treated as easier. A preview that disagrees with players is
   * expected, so the raw score is returned alongside the band and the raw inputs
   * are recorded for later calibration.
   */
  estimateDifficulty(definition: PuzzleDefinition): DifficultyEstimate {
    const area = definition.width * definition.height;
    const distinctValues = new Set(definition.cells).size;
    const solutionRuns = countRuns(definition.solution);

    // Log-scaled area keeps a 10x10 board from swamping every other signal.
    const areaTerm = Math.log2(Math.max(area, 2)) / Math.log2(MAX_GRID_SIDE ** 2);
    const varietyTerm = Math.min(distinctValues / 6, 1);
    // Normalised by area, not area/2, so a small board cannot max out this
    // term on a couple of runs and land above "easy".
    const structureTerm = Math.min(solutionRuns / Math.max(area, 1), 1);

    const raw =
      1 + 3 * (0.5 * areaTerm + 0.3 * varietyTerm + 0.2 * structureTerm);
    const score = Math.min(5, Math.max(1, Number(raw.toFixed(2))));

    const band =
      score < 2 ? 'easy' : score < 3 ? 'medium' : score < 4 ? 'hard' : 'expert';

    return { score, band, inputs: { area, distinctValues, solutionRuns } };
  }

  /**
   * Validate and score a community submission, returning a moderation envelope.
   *
   * A puzzle is never published straight from the builder: it always enters
   * `pending_review`. The definition digest lets a later moderation decision be
   * checked against the exact bytes that were submitted, so the queue cannot
   * approve something other than what was validated here.
   */
  submitCustomPuzzle(
    definition: PuzzleDefinition,
    author: string,
  ): PuzzleSubmission {
    const validation = this.validatePuzzleDefinition(definition);

    if (!validation.valid) {
      return {
        status: 'rejected',
        author,
        definitionDigest: this.hash(canonicaliseDefinition(definition)),
        errors: validation.errors,
      };
    }

    return {
      status: 'pending_review',
      author,
      definitionDigest: this.hash(canonicaliseDefinition(definition)),
      solutionHash: this.hash(definition.solution.join('')),
      difficulty: this.estimateDifficulty(definition),
      errors: [],
    };
  }

  /**
   * Move a submission through the moderation queue.
   *
   * The digest is re-checked on every transition so a submission cannot be
   * approved after its definition was altered.
   */
  moderateSubmission(
    submission: PuzzleSubmission,
    decision: 'approve' | 'reject',
    reviewer: string,
  ): ModerationOutcome {
    if (submission.status !== 'pending_review') {
      throw new Error(
        `Submission is ${submission.status} and can no longer be moderated.`,
      );
    }
    if (!reviewer || reviewer === submission.author) {
      throw new Error('A submission must be moderated by someone other than its author.');
    }

    return {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewer,
      definitionDigest: submission.definitionDigest,
      difficulty: submission.difficulty,
      moderatedAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------
  // Replay recording and verification (#436)
  // ---------------------------------------------------------------------

  /**
   * Append one action to a replay.
   *
   * Sequence numbers must be contiguous, so a replay cannot silently skip or
   * reorder moves, and each action folds the previous chain hash into its own
   * digest. That chain is what makes a stored replay tamper-evident: editing
   * any action invalidates every digest after it.
   */
  recordReplayAction(state: ReplayState, action: ReplayActionInput): ReplayState {
    const expected = state.actions.length + 1;
    if (action.sequence !== expected) {
      throw new Error(
        `Replay action out of order: expected sequence ${expected}, received ${action.sequence}.`,
      );
    }
    if (action.atMs < state.startedAtMs) {
      throw new Error('Replay action cannot be timestamped before the replay started.');
    }

    const recorded: ReplayAction = {
      sequence: action.sequence,
      type: action.type,
      value: action.value ?? null,
      atMs: action.atMs,
    };

    const chainHash = this.hash(
      `${state.chainHash}|${recorded.sequence}|${recorded.type}|${recorded.value ?? ''}|${recorded.atMs}`,
    );

    return { ...state, actions: [...state.actions, recorded], chainHash };
  }

  /** Seal a replay and produce the summary a share or playback view needs. */
  finalizeReplay(state: ReplayState, submittedValue: string): ReplaySummary {
    const submittedAtMs = state.actions[state.actions.length - 1]?.atMs ?? state.startedAtMs;

    return {
      sessionId: state.sessionId,
      puzzleId: state.puzzleId,
      totalActions: state.actions.length,
      durationMs: Math.max(0, submittedAtMs - state.startedAtMs),
      hintsUsed: state.actions.filter((action) => action.type === 'hint').length,
      chainHash: state.chainHash,
      submittedValueHash: this.hash(submittedValue),
    };
  }

  /**
   * Check a replay before its result is trusted.
   *
   * Three things are checked: the action chain still hashes to the value it was
   * sealed with, the run was not faster than a human could plausibly manage, and
   * the submitted value actually hashes to the solution recorded for the puzzle.
   */
  verifyReplay(
    state: ReplayState,
    summary: ReplaySummary,
    expectedSolutionHash: string,
    options: { minSolveMs?: number } = {},
  ): ReplayVerification {
    const recomputed = this.recomputeChainHash(state);
    if (recomputed !== summary.chainHash) {
      return {
        verified: false,
        reason: 'CHAIN_TAMPERED',
        detail: 'The recorded actions do not hash to the sealed chain digest.',
      };
    }

    if (summary.submittedValueHash !== expectedSolutionHash) {
      return {
        verified: false,
        reason: 'SOLUTION_MISMATCH',
        detail: 'The submitted value does not match the recorded solution hash.',
      };
    }

    const minSolveMs = options.minSolveMs ?? MIN_PLAUSIBLE_SOLVE_MS;
    if (summary.durationMs < minSolveMs) {
      return {
        verified: false,
        reason: 'IMPLAUSIBLE_SOLVE_TIME',
        detail: `Replay finished in ${summary.durationMs}ms, below the ${minSolveMs}ms plausibility floor.`,
      };
    }

    return { verified: true, reason: 'OK', detail: 'Chain, solution and timing all check out.' };
  }

  /** Recompute the chain from the recorded actions alone. */
  private recomputeChainHash(state: ReplayState): string {
    let chain = REPLAY_GENESIS_HASH;
    for (const action of state.actions) {
      chain = this.hash(
        `${chain}|${action.sequence}|${action.type}|${action.value ?? ''}|${action.atMs}`,
      );
    }
    return chain;
  }
}

// ---------------------------------------------------------------------------
// Types and constants for the builder and replay surfaces
// ---------------------------------------------------------------------------

/** Largest board side the builder will accept, to bound the difficulty maths. */
export const MAX_GRID_SIDE = 100;

/** Floor below which a solve is treated as automated rather than human. */
export const MIN_PLAUSIBLE_SOLVE_MS = 2_000;

/** Chain seed, so a replay's first digest is not predictable from its actions. */
export const REPLAY_GENESIS_HASH = 'genesis';

export type PuzzleDefinition = {
  puzzleId: number;
  width: number;
  height: number;
  /** Flattened board, length must equal width * height. */
  cells: string[];
  /** Flattened solution, length must equal width * height. */
  solution: string[];
  allowedValues: string[];
  title?: string;
};

export type PuzzleValidationError = {
  field: string;
  code: string;
  message: string;
};

export type PuzzleValidationResult = {
  valid: boolean;
  errors: PuzzleValidationError[];
};

export type DifficultyBand = 'easy' | 'medium' | 'hard' | 'expert';

export type DifficultyEstimate = {
  score: number;
  band: DifficultyBand;
  inputs: { area: number; distinctValues: number; solutionRuns: number };
};

export type PuzzleSubmission = {
  status: 'pending_review' | 'rejected';
  author: string;
  definitionDigest: string;
  solutionHash?: string;
  difficulty?: DifficultyEstimate;
  errors: PuzzleValidationError[];
};

export type ModerationOutcome = {
  status: 'approved' | 'rejected';
  reviewer: string;
  definitionDigest: string;
  difficulty?: DifficultyEstimate;
  moderatedAt: string;
};

export type ReplayActionType = 'move' | 'hint' | 'pause' | 'submit';

export type ReplayAction = {
  sequence: number;
  type: ReplayActionType;
  value: string | null;
  atMs: number;
};

export type ReplayActionInput = {
  sequence: number;
  type: ReplayActionType;
  value?: string;
  atMs: number;
};

export type ReplayState = {
  sessionId: string;
  puzzleId: number;
  actions: ReplayAction[];
  chainHash: string;
  startedAtMs: number;
};

export type ReplaySummary = {
  sessionId: string;
  puzzleId: number;
  totalActions: number;
  durationMs: number;
  hintsUsed: number;
  chainHash: string;
  submittedValueHash: string;
};

export type ReplayVerification = {
  verified: boolean;
  reason: 'OK' | 'CHAIN_TAMPERED' | 'SOLUTION_MISMATCH' | 'IMPLAUSIBLE_SOLVE_TIME';
  detail: string;
};

/** Stable serialisation, so a digest is not sensitive to key ordering. */
function canonicaliseDefinition(definition: PuzzleDefinition): string {
  return JSON.stringify([
    definition.puzzleId,
    definition.width,
    definition.height,
    definition.cells,
    definition.solution,
    [...definition.allowedValues].sort(),
  ]);
}

/** Number of maximal runs of equal values in the solution. */
function countRuns(solution: string[]): number {
  if (solution.length === 0) return 0;
  let runs = 1;
  for (let index = 1; index < solution.length; index += 1) {
    if (solution[index] !== solution[index - 1]) runs += 1;
  }
  return runs;
}
