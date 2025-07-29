import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IPuzzle, PuzzleGameState } from '../interfaces/puzzle.interfaces';
import {
  PuzzleType,
  PuzzleStatus,
  DifficultyLevel,
  ValidationError,
} from '../types/puzzle.types';
import type {
  PuzzleMove,
  PuzzleHint,
  ValidationResult,
} from '../types/puzzle.types';

/**
 * Abstract base class for all puzzle implementations
 * Provides common functionality and enforces the puzzle interface
 */
export abstract class BasePuzzle implements IPuzzle {
  protected readonly logger = new Logger(this.constructor.name);

  // Core properties
  public readonly id: string;
  public abstract readonly type: PuzzleType;
  public abstract title: string;
  public abstract description: string;
  public difficulty: DifficultyLevel = DifficultyLevel.MEDIUM;
  public timeLimit?: number;
  public maxMoves?: number;
  public tags: string[] = [];
  public metadata: Record<string, any> = {};

  // State management
  protected gameState: PuzzleGameState | null = null;
  protected undoStack: PuzzleGameState[] = [];
  protected redoStack: PuzzleGameState[] = [];

  constructor() {
    this.id = uuidv4();
  }

  // Abstract methods that must be implemented by concrete classes
  abstract initialize(config?: any): Promise<void>;
  abstract makeMove(move: PuzzleMove): Promise<ValidationResult>;
  abstract isComplete(): boolean;
  abstract isSolvable(): boolean;
  abstract generateHint(level: number): Promise<PuzzleHint>;
  abstract getType(): PuzzleType;
  abstract validateSolution(solution: any): boolean;
  abstract getSolution(): any;
  abstract getCurrentState(): any;
  abstract clone(): IPuzzle;

  // Protected abstract methods for puzzle-specific logic
  protected abstract validateMoveInternal(
    move: PuzzleMove,
  ): Promise<ValidationResult>;
  protected abstract applyMoveInternal(move: PuzzleMove): Promise<void>;
  protected abstract checkCompletionInternal(): boolean;
  protected abstract checkSolvabilityInternal(): boolean;
  protected abstract generateInitialState(config?: any): any;

  async reset(): Promise<void> {
    if (!this.gameState) {
      throw new Error('Puzzle not initialized');
    }

    // Clear undo/redo stacks
    this.undoStack = [];
    this.redoStack = [];

    // Reset to initial state
    this.gameState.status = PuzzleStatus.NOT_STARTED;
    this.gameState.moves = [];
    this.gameState.score = 0;
    this.gameState.hintsUsed = 0;
    this.gameState.metadata = { ...this.metadata };
    this.gameState.currentState = this.generateInitialState();

    this.logger.debug(`Reset puzzle ${this.id}`);
  }

  getState(): PuzzleGameState {
    if (!this.gameState) {
      throw new Error('Puzzle not initialized');
    }
    return { ...this.gameState };
  }

  async setState(state: PuzzleGameState): Promise<void> {
    this.gameState = { ...state };
    this.logger.debug(`Set state for puzzle ${this.id}`);
  }

  // Undo/Redo functionality
  async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      return false;
    }

    if (this.gameState) {
      this.redoStack.push({ ...this.gameState });
    }

    const previousState = this.undoStack.pop()!;
    this.gameState = { ...previousState };

    this.logger.debug(`Undid move for puzzle ${this.id}`);
    return true;
  }

  async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) {
      return false;
    }

    if (this.gameState) {
      this.undoStack.push({ ...this.gameState });
    }

    const nextState = this.redoStack.pop()!;
    this.gameState = { ...nextState };

    this.logger.debug(`Redid move for puzzle ${this.id}`);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Save state for undo functionality
  protected saveStateForUndo(): void {
    if (this.gameState) {
      this.undoStack.push({ ...this.gameState });
      // Clear redo stack when new move is made
      this.redoStack = [];

      // Limit undo stack size
      const maxUndoSteps = 50;
      if (this.undoStack.length > maxUndoSteps) {
        this.undoStack.shift();
      }
    }
  }

  // Helper methods for scoring
  protected calculateBaseScore(): number {
    if (!this.gameState) return 0;

    let score = 100 * this.difficulty;

    // Penalties
    score -= this.gameState.hintsUsed * 10;
    if (this.maxMoves && this.gameState.moves.length > this.maxMoves * 0.8) {
      score -= (this.gameState.moves.length - this.maxMoves * 0.8) * 5;
    }

    // Time bonus
    if (this.timeLimit && this.gameState.startTime) {
      const timeSpent = Date.now() - this.gameState.startTime.getTime();
      const timeRemaining = this.timeLimit - timeSpent;
      if (timeRemaining > 0) {
        score += Math.round((timeRemaining / this.timeLimit) * 50);
      }
    }

    return Math.max(0, Math.round(score));
  }

  // Helper method for move validation
  protected async validateMoveBase(
    move: PuzzleMove,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Basic validation
    if (!move.moveData) {
      errors.push({
        type: 'invalid_move_data',
        message: 'Move data is required',
        element: undefined,
        severity: 'high' as const,
      });
    }

    if (!this.gameState) {
      errors.push({
        type: 'invalid_state',
        message: 'Puzzle not initialized',
        element: undefined,
        severity: 'high' as const,
      });
    }

    if (this.gameState?.status === PuzzleStatus.COMPLETED) {
      errors.push({
        type: 'puzzle_completed',
        message: 'Cannot make moves on completed puzzle',
        element: undefined,
        severity: 'high' as const,
      });
    }

    // Time limit check
    if (this.timeLimit && this.gameState?.startTime) {
      const timeSpent = Date.now() - this.gameState.startTime.getTime();
      if (timeSpent > this.timeLimit) {
        errors.push({
          type: 'time_limit_exceeded',
          message: 'Time limit exceeded',
          element: undefined,
          severity: 'high' as const,
        });
      }
    }

    // Move limit check
    if (
      this.maxMoves &&
      this.gameState &&
      this.gameState.moves.length >= this.maxMoves
    ) {
      errors.push({
        type: 'move_limit_exceeded',
        message: 'Maximum moves exceeded',
        element: undefined,
        severity: 'high' as const,
      });
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      isComplete: this.isComplete(),
      score: isValid ? this.calculateBaseScore() : 0,
      errors,
      completionPercentage: this.calculateCompletionPercentage(),
    };
  }

  protected calculateCompletionPercentage(): number {
    if (this.isComplete()) return 100;

    // Default implementation - can be overridden by concrete classes
    if (!this.gameState?.moves.length) return 0;

    const expectedMoves = this.maxMoves || 20;
    return Math.min(95, (this.gameState.moves.length / expectedMoves) * 100);
  }

  // Helper method to generate common hint types
  protected generateBasicHint(
    level: number,
    content: string,
    targetElements?: string[],
  ): PuzzleHint {
    const hintTypes: Array<'visual' | 'textual' | 'interactive'> = [
      'textual',
      'visual',
      'interactive',
    ];
    const hintType = hintTypes[Math.min(level - 1, hintTypes.length - 1)];

    return {
      id: uuidv4(),
      level,
      type: hintType,
      content,
      targetElements,
      revealPercentage: Math.min(level * 20, 80), // Max 80% reveal
    };
  }

  // Timer management
  startTimer(): void {
    if (this.gameState) {
      this.gameState.startTime = new Date();
      this.gameState.status = PuzzleStatus.IN_PROGRESS;
    }
  }

  endTimer(): void {
    if (this.gameState) {
      this.gameState.endTime = new Date();
    }
  }

  getTimeSpent(): number {
    if (!this.gameState?.startTime) return 0;

    const endTime = this.gameState.endTime || new Date();
    return endTime.getTime() - this.gameState.startTime.getTime();
  }

  isTimeUp(): boolean {
    if (!this.timeLimit || !this.gameState?.startTime) return false;
    return this.getTimeSpent() > this.timeLimit;
  }
}
