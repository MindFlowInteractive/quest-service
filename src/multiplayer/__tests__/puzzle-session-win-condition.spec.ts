import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';
import { PuzzleSessionState } from '../interfaces/puzzle-session-state.interface';
import { evaluateWinCondition } from '../utils/puzzle-session-win-condition';

function player(userId: string, overrides: Record<string, any> = {}) {
  return {
    userId,
    status: PuzzlePlayerStatus.CONNECTED,
    connected: true,
    score: 0,
    progress: 0,
    role: PuzzlePlayerRole.CONTRIBUTOR,
    contributions: 0,
    contributionPoints: 0,
    ...overrides,
  };
}

function makeState(overrides: Record<string, any> = {}): PuzzleSessionState {
  return {
    sessionId: 'session-1',
    puzzleId: 'puzzle-1',
    version: 1,
    status: PuzzleSessionStatus.ACTIVE,
    players: {},
    sharedProgress: {
      completedSteps: [],
      discoveredHints: [],
      solvedSteps: [],
      stepContributors: {},
    },
    partialSolutions: {},
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluateWinCondition', () => {
  it('never auto-completes a session without requirements', () => {
    const result = evaluateWinCondition(makeState(), {});

    expect(result.satisfied).toBe(false);
    expect(result.hasRequirements).toBe(false);
    expect(result.progress.progressPercent).toBe(0);
  });

  it('is satisfied once every required step is solved', () => {
    const state = makeState({
      players: { 'user-1': player('user-1', { contributions: 1 }) },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1', 'step-2'],
        stepContributors: { 'step-1': 'user-1', 'step-2': 'user-1' },
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1', 'step-2'],
    });

    expect(result.satisfied).toBe(true);
    expect(result.reasons).toHaveLength(0);
    expect(result.progress.progressPercent).toBe(100);
  });

  it('reports the missing steps', () => {
    const state = makeState({
      players: { 'user-1': player('user-1', { contributions: 1 }) },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: { 'step-1': 'user-1' },
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1', 'step-2'],
    });

    expect(result.satisfied).toBe(false);
    expect(result.progress.missingSteps).toEqual(['step-2']);
    expect(result.reasons[0]).toMatch(/Missing 1 required step/);
  });

  it('requires the configured number of distinct contributors', () => {
    const state = makeState({
      players: {
        'user-1': player('user-1', { contributions: 1 }),
        'user-2': player('user-2', { contributions: 0 }),
      },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: { 'step-1': 'user-1' },
      },
    });

    const blocked = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1'],
      minContributors: 2,
    });
    expect(blocked.satisfied).toBe(false);
    expect(blocked.progress.contributors).toBe(1);

    state.sharedProgress.stepContributors['step-1'] = 'user-2';
    state.sharedProgress.stepContributors['step-2'] = 'user-2';
    state.sharedProgress.solvedSteps.push('step-2');

    const allowed = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1', 'step-2'],
      minContributors: 1,
    });
    expect(allowed.satisfied).toBe(true);
  });

  it('can require every connected player to contribute', () => {
    const state = makeState({
      players: {
        'user-1': player('user-1', { contributions: 2 }),
        'user-2': player('user-2', { contributions: 0 }),
      },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: { 'step-1': 'user-1' },
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1'],
      requireAllPlayers: true,
    });

    expect(result.satisfied).toBe(false);
    expect(result.reasons.join(' ')).toMatch(/have not contributed/);
  });

  it('ignores players that left the session', () => {
    const state = makeState({
      players: {
        'user-1': player('user-1', { contributions: 1 }),
        'user-2': player('user-2', {
          contributions: 0,
          connected: false,
          status: PuzzlePlayerStatus.LEFT,
        }),
      },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: { 'step-1': 'user-1' },
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1'],
      requireAllPlayers: true,
    });

    expect(result.progress.connectedPlayers).toBe(1);
    expect(result.satisfied).toBe(true);
  });

  it('falls back to players with contributions when attribution is missing', () => {
    const state = makeState({
      players: {
        'user-1': player('user-1', { contributions: 1 }),
        'user-2': player('user-2', { contributions: 1 }),
      },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: {},
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1'],
      minContributors: 2,
    });

    expect(result.progress.contributors).toBe(2);
    expect(result.satisfied).toBe(true);
  });

  it('computes partial progress', () => {
    const state = makeState({
      players: { 'user-1': player('user-1', { contributions: 1 }) },
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: ['step-1'],
        stepContributors: { 'step-1': 'user-1' },
      },
    });

    const result = evaluateWinCondition(state, {
      requiredSolvedSteps: ['step-1', 'step-2'],
      minContributors: 2,
    });

    // 0.7 * 0.5 (steps) + 0.3 * 0.5 (contributors) = 0.5
    expect(result.progress.progressPercent).toBe(50);
  });
});
