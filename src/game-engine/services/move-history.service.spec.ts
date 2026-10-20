import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PuzzleGameState } from '../interfaces/puzzle.interfaces';
import { GameMode, MoveHistoryAction } from '../types/move-history.types';
import {
  DifficultyLevel,
  PuzzleMove,
  PuzzleStatus,
  PuzzleType,
} from '../types/puzzle.types';
import { MoveHistoryService } from './move-history.service';

const buildConfig = (overrides: Record<string, any> = {}) => ({
  undoRedo: {
    enabled: true,
    defaultMaxUndoDepth: 10,
    maxUndoDepthByPuzzleType: {
      [PuzzleType.LOGIC_GRID]: 5,
      [PuzzleType.WORD_PUZZLE]: 20,
    },
    disabledModes: [GameMode.RANKED],
    penalizedModes: [GameMode.CHALLENGE, GameMode.TIMED],
    undoPenalty: 0.05,
    redoPenalty: 0.02,
    ...overrides,
  },
});

const buildState = (step: string, moves: PuzzleMove[] = []): PuzzleGameState =>
  ({
    puzzleId: 'puzzle-1',
    playerId: 'player-1',
    status: PuzzleStatus.IN_PROGRESS,
    currentState: {
      type: PuzzleType.LOGIC_GRID,
      difficulty: DifficultyLevel.MEDIUM,
      step,
    },
    moves,
    startTime: new Date('2024-01-01T00:00:00.000Z'),
    score: 100,
    hintsUsed: 0,
    metadata: {},
  } as PuzzleGameState);

const buildMove = (id: string): PuzzleMove => ({
  id,
  timestamp: new Date('2024-01-01T00:00:01.000Z'),
  playerId: 'player-1',
  puzzleId: 'puzzle-1',
  moveType: 'place',
  moveData: { cell: id },
  isValid: true,
});

describe('MoveHistoryService', () => {
  let service: MoveHistoryService;
  let config: ReturnType<typeof buildConfig>;

  beforeEach(() => {
    config = buildConfig();
    service = new MoveHistoryService(config as never);
  });

  describe('session lifecycle', () => {
    it('creates a history when a session starts', () => {
      const history = service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
      });

      expect(history.puzzleId).toBe('puzzle-1');
      expect(history.playerId).toBe('player-1');
      expect(history.puzzleType).toBe(PuzzleType.LOGIC_GRID);
      expect(history.mode).toBe(GameMode.PRACTICE);
      expect(history.entries).toHaveLength(0);
    });

    it('keeps the recorded history when a session is restarted', () => {
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m1'), {
        stateAfter: buildState('1'),
      });

      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
      });

      expect(service.getEntries('puzzle-1', 'player-1')).toHaveLength(1);
    });

    it('returns no history for an unknown session', () => {
      expect(service.getHistory('nope', 'nobody')).toBeUndefined();
      expect(service.getEntries('nope', 'nobody')).toEqual([]);
    });

    it('clears a session', () => {
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
      });

      expect(service.clearSession('puzzle-1', 'player-1')).toBe(true);
      expect(service.getHistory('puzzle-1', 'player-1')).toBeUndefined();
    });
  });

  describe('recording moves', () => {
    it('appends an entry and advances the cursor', () => {
      const s0 = buildState('0');
      const s1 = buildState('1', [buildMove('m1')]);
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });

      const entry = service.recordMove(
        'puzzle-1',
        'player-1',
        buildMove('m1'),
        {
          stateBefore: s0,
          stateAfter: s1,
        },
      );

      expect(entry.action).toBe(MoveHistoryAction.MOVE);
      expect(entry.sequence).toBe(1);
      expect(entry.stateBefore).toBe(s0);
      expect(entry.stateAfter).toBe(s1);
      expect(service.getHistory('puzzle-1', 'player-1').cursor).toBe(1);
    });

    it('derives the resulting state from the previous one when omitted', () => {
      const s0 = buildState('0');
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });

      const entry = service.recordMove('puzzle-1', 'player-1', buildMove('m1'));

      expect(entry.stateAfter.moves).toHaveLength(1);
      expect(entry.stateAfter.moves[0].id).toBe('m1');
    });
  });

  describe('undo and redo', () => {
    const playThreeMoves = () => {
      const s0 = buildState('0');
      const s1 = buildState('1', [buildMove('m1')]);
      const s2 = buildState('2', [buildMove('m1'), buildMove('m2')]);
      const s3 = buildState('3', [
        buildMove('m1'),
        buildMove('m2'),
        buildMove('m3'),
      ]);

      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m1'), {
        stateBefore: s0,
        stateAfter: s1,
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m2'), {
        stateBefore: s1,
        stateAfter: s2,
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m3'), {
        stateBefore: s2,
        stateAfter: s3,
      });

      return { s0, s1, s2, s3 };
    };

    it('restores the exact prior state on undo', () => {
      const { s2 } = playThreeMoves();

      const result = service.undo('puzzle-1', 'player-1');

      expect(result.state).toBe(s2);
      expect(result.state.currentState.step).toBe('2');
      expect(result.entry.action).toBe(MoveHistoryAction.UNDO);
      expect(result.canUndo).toBe(true);
      expect(result.canRedo).toBe(true);
    });

    it('re-applies the undone move on redo', () => {
      const { s3 } = playThreeMoves();
      service.undo('puzzle-1', 'player-1');

      const result = service.redo('puzzle-1', 'player-1');

      expect(result.state).toBe(s3);
      expect(result.state.currentState.step).toBe('3');
      expect(result.entry.action).toBe(MoveHistoryAction.REDO);
    });

    it('undoes and redoes repeatedly to the same state', () => {
      const { s0, s1, s2 } = playThreeMoves();

      expect(service.undo('puzzle-1', 'player-1').state).toBe(s2);
      expect(service.undo('puzzle-1', 'player-1').state).toBe(s1);
      expect(service.undo('puzzle-1', 'player-1').state).toBe(s0);

      expect(service.redo('puzzle-1', 'player-1').state).toBe(s1);
      expect(service.redo('puzzle-1', 'player-1').state).toBe(s2);
    });

    it('rejects an undo when there is nothing left to undo', () => {
      const s0 = buildState('0');
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });

      expect(() => service.undo('puzzle-1', 'player-1')).toThrow(
        BadRequestException,
      );
    });

    it('rejects a redo when there is nothing left to redo', () => {
      playThreeMoves();

      expect(() => service.redo('puzzle-1', 'player-1')).toThrow(
        BadRequestException,
      );
    });

    it('discards the redo branch when a new move is made', () => {
      const { s1 } = playThreeMoves();
      service.undo('puzzle-1', 'player-1');

      service.recordMove('puzzle-1', 'player-1', buildMove('m4'), {
        stateBefore: s1,
        stateAfter: buildState('4'),
      });

      expect(() => service.redo('puzzle-1', 'player-1')).toThrow(
        BadRequestException,
      );
    });

    it('records undo and redo in the history', () => {
      playThreeMoves();
      service.undo('puzzle-1', 'player-1');
      service.redo('puzzle-1', 'player-1');

      const actions = service
        .getEntries('puzzle-1', 'player-1')
        .map((entry) => entry.action);

      expect(actions).toEqual([
        MoveHistoryAction.MOVE,
        MoveHistoryAction.MOVE,
        MoveHistoryAction.MOVE,
        MoveHistoryAction.UNDO,
        MoveHistoryAction.REDO,
      ]);
    });

    it('rejects an undo for a session that has no history', () => {
      expect(() => service.undo('puzzle-1', 'nobody')).toThrow();
    });
  });

  describe('undo depth per puzzle type', () => {
    it('uses the configured depth for each puzzle type', () => {
      expect(service.getMaxUndoDepth(PuzzleType.LOGIC_GRID)).toBe(5);
      expect(service.getMaxUndoDepth(PuzzleType.WORD_PUZZLE)).toBe(20);
      expect(service.getMaxUndoDepth(PuzzleType.CUSTOM)).toBe(10);
    });

    it('does not allow undoing beyond the per-type depth', () => {
      const s0 = buildState('0');
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });

      for (let i = 1; i <= 8; i++) {
        service.recordMove('puzzle-1', 'player-1', buildMove(`m${i}`), {
          stateAfter: buildState(String(i)),
        });
      }

      // A logic grid keeps a depth of 5, so exactly five undos are possible.
      for (let i = 0; i < 5; i++) {
        expect(() => service.undo('puzzle-1', 'player-1')).not.toThrow();
      }
      expect(() => service.undo('puzzle-1', 'player-1')).toThrow(
        BadRequestException,
      );
    });

    it('bounds the number of retained state snapshots', () => {
      const s0 = buildState('0');
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });

      for (let i = 1; i <= 8; i++) {
        service.recordMove('puzzle-1', 'player-1', buildMove(`m${i}`), {
          stateAfter: buildState(String(i)),
        });
      }

      const history = service.getHistory('puzzle-1', 'player-1');
      expect(history.states.length).toBe(6); // maxUndoDepth + current state
    });
  });

  describe('ranked mode rules', () => {
    const playOneMove = (mode: GameMode) => {
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        mode,
        initialState: buildState('0'),
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m1'), {
        stateAfter: buildState('1'),
      });
    };

    it('disables undo in ranked mode', () => {
      playOneMove(GameMode.RANKED);

      expect(service.isUndoAllowed(GameMode.RANKED)).toBe(false);
      expect(() => service.undo('puzzle-1', 'player-1')).toThrow(
        ForbiddenException,
      );
    });

    it('disables redo in ranked mode', () => {
      playOneMove(GameMode.RANKED);

      expect(() => service.redo('puzzle-1', 'player-1')).toThrow(
        ForbiddenException,
      );
    });

    it('allows undo in practice mode', () => {
      playOneMove(GameMode.PRACTICE);

      expect(() => service.undo('puzzle-1', 'player-1')).not.toThrow();
    });

    it('charges a score penalty for undo in a penalised mode', () => {
      playOneMove(GameMode.CHALLENGE);

      const result = service.undo('puzzle-1', 'player-1');

      expect(result.scorePenalty).toBe(0.05);
      expect(result.entry.scorePenalty).toBe(0.05);
      expect(service.getHistory('puzzle-1', 'player-1').totalPenalty).toBe(
        0.05,
      );
    });

    it('charges a score penalty for redo in a penalised mode', () => {
      playOneMove(GameMode.TIMED);
      service.undo('puzzle-1', 'player-1');

      const result = service.redo('puzzle-1', 'player-1');

      expect(result.scorePenalty).toBe(0.02);
    });

    it('does not charge a penalty in practice mode', () => {
      playOneMove(GameMode.PRACTICE);

      const result = service.undo('puzzle-1', 'player-1');

      expect(result.scorePenalty).toBe(0);
      expect(service.getHistory('puzzle-1', 'player-1').totalPenalty).toBe(0);
    });

    it('disables undo everywhere when the feature is turned off', () => {
      service = new MoveHistoryService(
        buildConfig({ enabled: false }) as never,
      );
      playOneMove(GameMode.PRACTICE);

      expect(() => service.undo('puzzle-1', 'player-1')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('policy reporting', () => {
    it('reports the effective policy for a session', () => {
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        mode: GameMode.CHALLENGE,
        initialState: buildState('0'),
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m1'), {
        stateAfter: buildState('1'),
      });

      const policy = service.getPolicy('puzzle-1', 'player-1');

      expect(policy.mode).toBe(GameMode.CHALLENGE);
      expect(policy.maxUndoDepth).toBe(5);
      expect(policy.undoAllowed).toBe(true);
      expect(policy.undoPenalty).toBe(0.05);
      expect(policy.canUndo).toBe(true);
      expect(policy.canRedo).toBe(false);
    });
  });

  describe('replay integration', () => {
    it('converts the history into replay actions', () => {
      const s0 = buildState('0');
      service.startSession('puzzle-1', 'player-1', {
        puzzleType: PuzzleType.LOGIC_GRID,
        initialState: s0,
      });
      service.recordMove('puzzle-1', 'player-1', buildMove('m1'), {
        stateAfter: buildState('1'),
      });
      service.undo('puzzle-1', 'player-1');

      const actions = service.toReplayActions('puzzle-1', 'player-1');

      expect(actions).toHaveLength(2);
      expect(actions[0].actionType).toBe('MOVE');
      expect(actions[0].actionData.moveId).toBe('m1');
      expect(actions[1].actionType).toBe('UNDO');
      expect(actions[1].metadata.undoCount).toBe(1);
      expect(actions[0].timestamp).toBeGreaterThanOrEqual(0);
      expect(actions[1].timestamp).toBeGreaterThanOrEqual(actions[0].timestamp);
    });

    it('returns no actions for an unknown session', () => {
      expect(service.toReplayActions('nope', 'nobody')).toEqual([]);
    });
  });
});
