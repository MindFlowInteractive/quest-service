import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { gameEngineConfig } from '../config/game-engine.config';
import type { PuzzleGameState } from '../interfaces/puzzle.interfaces';
import {
  GameMode,
  MoveHistory,
  MoveHistoryAction,
  MoveHistoryEntry,
  MoveHistorySnapshot,
  ReplayActionDraft,
  UndoRedoPolicy,
} from '../types/move-history.types';
import { PuzzleMove, PuzzleType } from '../types/puzzle.types';

export interface StartSessionOptions {
  puzzleType?: PuzzleType;
  mode?: GameMode;
  /** The state the puzzle started from, if it is already known. */
  initialState?: PuzzleGameState;
}

export interface RecordMoveOptions {
  puzzleType?: PuzzleType;
  mode?: GameMode;
  /** State before the move; derived from the history when omitted. */
  stateBefore?: PuzzleGameState;
  /** State after the move; derived from the history when omitted. */
  stateAfter?: PuzzleGameState;
}

/**
 * Tracks the move history of a puzzle session and implements undo/redo on top
 * of it.
 *
 * The history is a linear list of state snapshots plus a cursor into it, which
 * is the classic undo/redo model: undo moves the cursor back, redo moves it
 * forward, and a new move discards whatever was ahead of the cursor.
 *
 * Two rules are enforced:
 *
 * - **Undo depth is limited per puzzle type.** Complex puzzles keep a shallow
 *   history because their state snapshots are large.
 * - **Ranked modes do not get a free undo.** Competitive modes either disable
 *   undo outright or charge a score penalty for it.
 */
@Injectable()
export class MoveHistoryService {
  private readonly logger = new Logger(MoveHistoryService.name);
  private readonly histories = new Map<string, MoveHistory>();

  constructor(
    @Inject(gameEngineConfig.KEY)
    private readonly config: ConfigType<typeof gameEngineConfig>,
  ) {}

  // ─── Session lifecycle ───────────────────────────────────────────────────

  /**
   * Starts (or returns) the move history for a puzzle session.
   *
   * The puzzle type and the mode can only be corrected while the session is
   * still empty. Once moves have been recorded they are locked, so a client
   * cannot switch a ranked session to a penalised one to get a free undo.
   */
  startSession(
    puzzleId: string,
    playerId: string,
    options: StartSessionOptions = {},
  ): MoveHistory {
    const key = this.key(puzzleId, playerId);
    const existing = this.histories.get(key);

    if (existing) {
      if (existing.entries.length === 0) {
        if (options.mode) {
          existing.mode = options.mode;
        }
        if (options.puzzleType) {
          existing.puzzleType = options.puzzleType;
          existing.maxUndoDepth = this.getMaxUndoDepth(options.puzzleType);
        }
      }
      return existing;
    }

    const puzzleType = options.puzzleType ?? PuzzleType.CUSTOM;
    const history: MoveHistory = {
      puzzleId,
      playerId,
      puzzleType,
      mode: options.mode ?? GameMode.PRACTICE,
      entries: [],
      states: options.initialState ? [options.initialState] : [],
      cursor: options.initialState ? 0 : -1,
      maxUndoDepth: this.getMaxUndoDepth(puzzleType),
      undoCount: 0,
      redoCount: 0,
      totalPenalty: 0,
    };

    this.histories.set(key, history);
    return history;
  }

  /** The move history of a session, if one has been started. */
  getHistory(puzzleId: string, playerId: string): MoveHistory | undefined {
    return this.histories.get(this.key(puzzleId, playerId));
  }

  /** The ordered action log of a session. */
  getEntries(puzzleId: string, playerId: string): MoveHistoryEntry[] {
    return this.getHistory(puzzleId, playerId)?.entries ?? [];
  }

  /** Drops the history of a session, e.g. when the puzzle is reset. */
  clearSession(puzzleId: string, playerId: string): boolean {
    return this.histories.delete(this.key(puzzleId, playerId));
  }

  // ─── Recording moves ─────────────────────────────────────────────────────

  /**
   * Records a move in the session history and advances the undo cursor.
   *
   * Any redo branch is discarded, because a new move invalidates the future
   * that a redo would have restored.
   */
  recordMove(
    puzzleId: string,
    playerId: string,
    move: PuzzleMove,
    options: RecordMoveOptions = {},
  ): MoveHistoryEntry {
    const history = this.startSession(puzzleId, playerId, {
      puzzleType: options.puzzleType,
      mode: options.mode,
    });

    const stateBefore =
      options.stateBefore ??
      (history.cursor >= 0 ? history.states[history.cursor] : null);

    const stateAfter =
      options.stateAfter ??
      (stateBefore
        ? { ...stateBefore, moves: [...(stateBefore.moves ?? []), move] }
        : null);

    // A new move invalidates everything ahead of the cursor.
    if (history.cursor < history.states.length - 1) {
      history.states = history.states.slice(0, history.cursor + 1);
    }

    if (stateAfter) {
      history.states.push(stateAfter);
      history.cursor = history.states.length - 1;
    }

    this.trimToUndoDepth(history);

    const entry: MoveHistoryEntry = {
      sequence: history.entries.length + 1,
      action: MoveHistoryAction.MOVE,
      move,
      stateBefore,
      stateAfter,
      timestamp: new Date(),
      undoCount: history.undoCount,
      redoCount: history.redoCount,
      scorePenalty: 0,
    };

    history.entries.push(entry);
    return entry;
  }

  // ─── Undo / redo ─────────────────────────────────────────────────────────

  /**
   * Restores the state that preceded the most recent move.
   *
   * @throws ForbiddenException when undo is disabled for the session mode.
   * @throws BadRequestException when there is nothing left to undo.
   */
  undo(puzzleId: string, playerId: string): MoveHistorySnapshot {
    const history = this.requireHistory(puzzleId, playerId);
    this.assertUndoAllowed(history);

    if (history.cursor <= 0) {
      throw new BadRequestException('There is nothing left to undo');
    }

    const stateBefore = history.states[history.cursor];
    history.cursor -= 1;
    const state = history.states[history.cursor];

    history.undoCount += 1;
    const scorePenalty = this.getUndoPenalty(history.mode);
    history.totalPenalty += scorePenalty;

    const entry: MoveHistoryEntry = {
      sequence: history.entries.length + 1,
      action: MoveHistoryAction.UNDO,
      move: null,
      stateBefore,
      stateAfter: state,
      timestamp: new Date(),
      undoCount: history.undoCount,
      redoCount: history.redoCount,
      scorePenalty,
    };
    history.entries.push(entry);

    this.logger.debug(
      `Undid a move for puzzle ${puzzleId} (player ${playerId})`,
    );

    return {
      state,
      entry,
      scorePenalty,
      canUndo: history.cursor > 0,
      canRedo: history.cursor < history.states.length - 1,
    };
  }

  /**
   * Re-applies the move that was most recently undone.
   *
   * @throws ForbiddenException when undo is disabled for the session mode.
   * @throws BadRequestException when there is nothing left to redo.
   */
  redo(puzzleId: string, playerId: string): MoveHistorySnapshot {
    const history = this.requireHistory(puzzleId, playerId);
    this.assertUndoAllowed(history);

    if (history.cursor >= history.states.length - 1) {
      throw new BadRequestException('There is nothing left to redo');
    }

    const stateBefore = history.states[history.cursor];
    history.cursor += 1;
    const state = history.states[history.cursor];

    history.redoCount += 1;
    const scorePenalty = this.getRedoPenalty(history.mode);
    history.totalPenalty += scorePenalty;

    const entry: MoveHistoryEntry = {
      sequence: history.entries.length + 1,
      action: MoveHistoryAction.REDO,
      move: null,
      stateBefore,
      stateAfter: state,
      timestamp: new Date(),
      undoCount: history.undoCount,
      redoCount: history.redoCount,
      scorePenalty,
    };
    history.entries.push(entry);

    this.logger.debug(
      `Redid a move for puzzle ${puzzleId} (player ${playerId})`,
    );

    return {
      state,
      entry,
      scorePenalty,
      canUndo: history.cursor > 0,
      canRedo: history.cursor < history.states.length - 1,
    };
  }

  // ─── Policy ──────────────────────────────────────────────────────────────

  /** The maximum number of steps that may be undone for a puzzle type. */
  getMaxUndoDepth(puzzleType: PuzzleType): number {
    const perType = this.config.undoRedo.maxUndoDepthByPuzzleType?.[puzzleType];
    if (typeof perType === 'number') {
      return perType;
    }
    return this.config.undoRedo.defaultMaxUndoDepth;
  }

  /** False when undo is disabled entirely for the given mode. */
  isUndoAllowed(mode: GameMode): boolean {
    if (!this.config.undoRedo.enabled) {
      return false;
    }
    return !this.config.undoRedo.disabledModes.includes(mode);
  }

  /** The score penalty charged for a single undo in the given mode. */
  getUndoPenalty(mode: GameMode): number {
    if (!this.config.undoRedo.penalizedModes.includes(mode)) {
      return 0;
    }
    return this.config.undoRedo.undoPenalty;
  }

  /** The score penalty charged for a single redo in the given mode. */
  getRedoPenalty(mode: GameMode): number {
    if (!this.config.undoRedo.penalizedModes.includes(mode)) {
      return 0;
    }
    return this.config.undoRedo.redoPenalty;
  }

  /** The effective rules that apply to a session. */
  getPolicy(puzzleId: string, playerId: string): UndoRedoPolicy {
    const history = this.getHistory(puzzleId, playerId);
    const mode = history?.mode ?? GameMode.PRACTICE;
    const puzzleType = history?.puzzleType ?? PuzzleType.CUSTOM;

    return {
      mode,
      puzzleType,
      maxUndoDepth: history?.maxUndoDepth ?? this.getMaxUndoDepth(puzzleType),
      undoAllowed: this.isUndoAllowed(mode),
      undoPenalty: this.getUndoPenalty(mode),
      redoPenalty: this.getRedoPenalty(mode),
      canUndo: (history?.cursor ?? -1) > 0,
      canRedo: history ? history.cursor < history.states.length - 1 : false,
    };
  }

  // ─── Replay integration ──────────────────────────────────────────────────

  /**
   * Converts the move history of a session into replay actions.
   *
   * The shape is compatible with the replay module's action DTO, so a history
   * can be handed to the replay system without either module depending on the
   * other.
   */
  toReplayActions(puzzleId: string, playerId: string): ReplayActionDraft[] {
    const history = this.getHistory(puzzleId, playerId);
    if (!history || history.entries.length === 0) {
      return [];
    }

    const start = history.entries[0].timestamp.getTime();

    return history.entries.map((entry) => this.toReplayAction(entry, start));
  }

  /**
   * Converts a single history entry into a replay action.
   *
   * @param entry the history entry to convert
   * @param start the timestamp the replay starts at; defaults to the entry's
   *             own timestamp, which makes the relative timestamp zero.
   */
  toReplayAction(entry: MoveHistoryEntry, start?: number): ReplayActionDraft {
    const origin = start ?? entry.timestamp.getTime();

    return {
      actionType: this.toReplayActionType(entry.action),
      timestamp: entry.timestamp.getTime() - origin,
      actionData: {
        sequence: entry.sequence,
        moveId: entry.move?.id ?? null,
        moveType: entry.move?.moveType ?? null,
        moveData: entry.move?.moveData ?? {},
        isValid: entry.move?.isValid ?? null,
      },
      stateBefore: entry.stateBefore
        ? (entry.stateBefore.currentState as Record<string, any>)
        : undefined,
      stateAfter: entry.stateAfter
        ? (entry.stateAfter.currentState as Record<string, any>)
        : undefined,
      metadata: {
        undoCount: entry.undoCount,
        redoCount: entry.redoCount,
        scorePenalty: entry.scorePenalty,
      },
    };
  }

  // ─── Internals ───────────────────────────────────────────────────────────

  private key(puzzleId: string, playerId: string): string {
    return `${puzzleId}:${playerId}`;
  }

  private requireHistory(puzzleId: string, playerId: string): MoveHistory {
    const history = this.getHistory(puzzleId, playerId);
    if (!history) {
      throw new NotFoundException(
        `No move history for puzzle ${puzzleId} (player ${playerId})`,
      );
    }
    return history;
  }

  private assertUndoAllowed(history: MoveHistory): void {
    if (!this.isUndoAllowed(history.mode)) {
      throw new ForbiddenException(`Undo is disabled in ${history.mode} mode`);
    }
  }

  /**
   * Drops the oldest snapshots so that at most `maxUndoDepth` steps can be
   * undone. This bounds both the undo depth and the memory held per session.
   */
  private trimToUndoDepth(history: MoveHistory): void {
    const maxStates = history.maxUndoDepth + 1;
    if (history.states.length <= maxStates) {
      return;
    }
    const excess = history.states.length - maxStates;
    history.states.splice(0, excess);
    history.cursor -= excess;
  }

  private toReplayActionType(
    action: MoveHistoryAction,
  ): ReplayActionDraft['actionType'] {
    switch (action) {
      case MoveHistoryAction.UNDO:
        return 'UNDO';
      case MoveHistoryAction.REDO:
        return 'REDO';
      case MoveHistoryAction.RESET:
        return 'STATE_CHANGE';
      default:
        return 'MOVE';
    }
  }
}
