import type { PuzzleGameState } from '../interfaces/puzzle.interfaces';
import type { PuzzleMove } from './puzzle.types';
import { PuzzleType } from './puzzle.types';

/** The modes a puzzle session can be played in. */
export enum GameMode {
  PRACTICE = 'practice',
  CHALLENGE = 'challenge',
  TIMED = 'timed',
  ZEN = 'zen',
  RANKED = 'ranked',
}

/** The kinds of action that can appear in a move history. */
export enum MoveHistoryAction {
  MOVE = 'move',
  UNDO = 'undo',
  REDO = 'redo',
  RESET = 'reset',
}

/**
 * Default number of undo steps kept for each puzzle type.
 *
 * Complex puzzles hold large state snapshots, so they keep a shallower
 * history; simple puzzles can afford a deeper one. The environment
 * configuration may override each of these.
 */
export const DEFAULT_UNDO_DEPTH_BY_PUZZLE_TYPE: Partial<
  Record<PuzzleType, number>
> = {
  [PuzzleType.LOGIC_GRID]: 5,
  [PuzzleType.SEQUENCE]: 5,
  [PuzzleType.SPATIAL]: 8,
  [PuzzleType.MATHEMATICAL]: 10,
  [PuzzleType.WORD_PUZZLE]: 20,
  [PuzzleType.PATTERN_MATCHING]: 15,
  [PuzzleType.CUSTOM]: 10,
};

/** Fallback undo depth for puzzle types without an explicit limit. */
export const DEFAULT_UNDO_DEPTH = 10;

/** A single entry in a session's move history. */
export interface MoveHistoryEntry {
  /** Monotonically increasing sequence number within the session. */
  sequence: number;
  action: MoveHistoryAction;
  /** The move that produced this entry; null for undo/redo/reset. */
  move: PuzzleMove | null;
  /** Puzzle state before the action was applied. */
  stateBefore: PuzzleGameState | null;
  /** Puzzle state after the action was applied. */
  stateAfter: PuzzleGameState | null;
  timestamp: Date;
  /** Running total of undos at the time this entry was recorded. */
  undoCount: number;
  /** Running total of redos at the time this entry was recorded. */
  redoCount: number;
  /** Score penalty charged by this entry (0 when undo is free). */
  scorePenalty: number;
}

/** The move history of a single puzzle session. */
export interface MoveHistory {
  puzzleId: string;
  playerId: string;
  puzzleType: PuzzleType;
  mode: GameMode;
  /** Ordered action log — this is the replayable history. */
  entries: MoveHistoryEntry[];
  /** Retained state snapshots, oldest first. */
  states: PuzzleGameState[];
  /** Index of the current state inside `states`. */
  cursor: number;
  /** Maximum number of steps that may be undone for this puzzle type. */
  maxUndoDepth: number;
  undoCount: number;
  redoCount: number;
  /** Accumulated score penalty charged by undo/redo. */
  totalPenalty: number;
}

/** The outcome of a successful undo or redo. */
export interface MoveHistorySnapshot {
  /** The state that was restored. */
  state: PuzzleGameState;
  /** The history entry recorded for the action. */
  entry: MoveHistoryEntry;
  /** Score penalty charged by the action. */
  scorePenalty: number;
  canUndo: boolean;
  canRedo: boolean;
}

/** The effective undo/redo rules that apply to a session. */
export interface UndoRedoPolicy {
  mode: GameMode;
  puzzleType: PuzzleType;
  /** Maximum number of steps that may be undone. */
  maxUndoDepth: number;
  /** False when undo is disabled entirely for the mode. */
  undoAllowed: boolean;
  /** Score penalty charged per undo in this mode. */
  undoPenalty: number;
  /** Score penalty charged per redo in this mode. */
  redoPenalty: number;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * A replay action derived from a move history entry.
 *
 * Structurally compatible with the replay module's action DTO, so a history
 * can be replayed without either module depending on the other.
 */
export interface ReplayActionDraft {
  actionType: 'MOVE' | 'UNDO' | 'REDO' | 'STATE_CHANGE';
  timestamp: number;
  actionData: Record<string, any>;
  stateBefore?: Record<string, any>;
  stateAfter?: Record<string, any>;
  metadata: {
    duration?: number;
    difficulty?: string;
    confidence?: number;
    notes?: string;
    [key: string]: any;
  };
}
