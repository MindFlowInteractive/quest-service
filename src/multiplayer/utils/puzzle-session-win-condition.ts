import { PuzzleSessionState } from '../interfaces/puzzle-session-state.interface';

/**
 * Declarative win condition for a co-operative session.
 *
 * - requiredSolvedSteps: every step id that the team must solve.
 * - minContributors: how many distinct players must have contributed.
 * - requireAllPlayers: every connected player must contribute at least once.
 *
 * A session with no requirements is never auto-completed; it must be closed
 * explicitly via the existing `complete` endpoint (legacy behaviour).
 */
export interface WinCondition {
  requiredSolvedSteps?: string[];
  minContributors?: number;
  requireAllPlayers?: boolean;
}

export interface WinConditionProgress {
  requiredSteps: string[];
  solvedRequiredSteps: string[];
  missingSteps: string[];
  contributors: number;
  requiredContributors: number;
  connectedPlayers: number;
  contributingPlayers: number;
  progressPercent: number;
}

export interface WinConditionResult {
  satisfied: boolean;
  hasRequirements: boolean;
  reasons: string[];
  progress: WinConditionProgress;
}

/**
 * Pure evaluation of a team win condition against the shared session state.
 * Kept dependency-free so it is cheap to call on every submitted solution and
 * easy to unit test.
 */
export function evaluateWinCondition(
  state: PuzzleSessionState,
  condition: WinCondition = {},
): WinConditionResult {
  const players = Object.values(state.players ?? {});
  const connectedPlayers = players.filter(
    (player) => player.connected && String(player.status) !== 'LEFT',
  );
  const contributingPlayers = players.filter(
    (player) => (player.contributions ?? 0) > 0,
  );

  const solvedSteps = state.sharedProgress?.solvedSteps ?? [];
  const requiredSteps = Array.from(
    new Set((condition.requiredSolvedSteps ?? []).filter(Boolean)),
  );
  const solvedRequiredSteps = requiredSteps.filter((step) =>
    solvedSteps.includes(step),
  );
  const missingSteps = requiredSteps.filter(
    (step) => !solvedSteps.includes(step),
  );

  const stepContributors = state.sharedProgress?.stepContributors ?? {};
  const requiredContributorIds = new Set(
    requiredSteps
      .map((step) => stepContributors[step])
      .filter((userId): userId is string => Boolean(userId)),
  );
  // Fall back to players with any contribution when per-step attribution is
  // unavailable (for example a session resumed from an older state shape).
  const contributors =
    requiredContributorIds.size > 0
      ? requiredContributorIds.size
      : contributingPlayers.length;

  const requiredContributors = Math.max(1, condition.minContributors ?? 1);
  const hasRequirements =
    requiredSteps.length > 0 ||
    requiredContributors > 1 ||
    condition.requireAllPlayers === true;

  const reasons: string[] = [];
  if (requiredSteps.length > 0 && missingSteps.length > 0) {
    reasons.push(`Missing ${missingSteps.length} required step(s)`);
  }
  if (contributors < requiredContributors) {
    reasons.push(
      `Needs ${requiredContributors - contributors} more contributor(s)`,
    );
  }
  if (condition.requireAllPlayers) {
    const silent = connectedPlayers.filter(
      (player) => (player.contributions ?? 0) === 0,
    );
    if (silent.length > 0) {
      reasons.push(`${silent.length} connected player(s) have not contributed`);
    }
  }

  const stepProgress =
    requiredSteps.length === 0
      ? 0
      : solvedRequiredSteps.length / requiredSteps.length;
  const contributorProgress = Math.min(
    1,
    contributors / requiredContributors,
  );
  const progressPercent = hasRequirements
    ? Math.round(
        (requiredSteps.length > 0
          ? 0.7 * stepProgress + 0.3 * contributorProgress
          : contributorProgress) * 100,
      )
    : 0;

  return {
    satisfied: hasRequirements && reasons.length === 0,
    hasRequirements,
    reasons,
    progress: {
      requiredSteps,
      solvedRequiredSteps,
      missingSteps,
      contributors,
      requiredContributors,
      connectedPlayers: connectedPlayers.length,
      contributingPlayers: contributingPlayers.length,
      progressPercent,
    },
  };
}
