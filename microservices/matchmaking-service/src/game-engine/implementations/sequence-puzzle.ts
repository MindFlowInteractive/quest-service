import { v4 as uuidv4 } from 'uuid';
import { BasePuzzle } from './base-puzzle';
import type { IPuzzle } from '../interfaces/puzzle.interfaces';
import {
  PuzzleType,
  PuzzleStatus,
} from '../types/puzzle.types';
import type {
  PuzzleMove,
  PuzzleHint,
  ValidationResult,
} from '../types/puzzle.types';

interface SequenceElement {
  value: number | string;
  position: number;
  isVisible: boolean;
  isUserFilled: boolean;
}

interface SequenceState {
  sequence: SequenceElement[];
  pattern: SequencePattern;
  targetLength: number;
  currentPosition: number;
}

interface SequencePattern {
  type: 'arithmetic' | 'geometric' | 'fibonacci' | 'polynomial' | 'custom';
  parameters: Record<string, any>;
  description: string;
}

/**
 * Sequence Puzzle Implementation
 * Players must identify patterns and continue sequences
 */
export class SequencePuzzle extends BasePuzzle {
  public readonly type: PuzzleType = PuzzleType.SEQUENCE;
  public title: string = 'Number Sequence';
  public description: string = 'Find the pattern and continue the sequence';

  private puzzleState: SequenceState | null = null;

  async initialize(config?: any): Promise<void> {
    const pattern = config?.pattern || this.generatePattern();
    const targetLength = config?.targetLength || this.getTargetLength();

    const sequence = this.generateSequence(pattern, targetLength);
    this.hideSequenceElements(sequence);

    this.puzzleState = {
      sequence,
      pattern,
      targetLength,
      currentPosition: this.findFirstHiddenPosition(sequence),
    };

    // Set difficulty-based constraints
    this.setDifficultyConstraints();

    // Initialize game state
    this.gameState = {
      puzzleId: this.id,
      playerId: '',
      status: PuzzleStatus.NOT_STARTED,
      currentState: this.puzzleState,
      moves: [],
      startTime: new Date(),
      score: 0,
      hintsUsed: 0,
      metadata: { ...this.metadata },
    };

    this.logger.log(
      `Initialized Sequence puzzle ${this.id} with pattern: ${pattern.type}`,
    );
  }

  private generatePattern(): SequencePattern {
    const patterns = [
      {
        type: 'arithmetic' as const,
        parameters: { difference: this.getRandomInt(2, 10) },
        description: 'Arithmetic sequence (constant difference)',
      },
      {
        type: 'geometric' as const,
        parameters: { ratio: this.getRandomInt(2, 4) },
        description: 'Geometric sequence (constant ratio)',
      },
      {
        type: 'fibonacci' as const,
        parameters: {},
        description: 'Fibonacci sequence (sum of previous two)',
      },
      {
        type: 'polynomial' as const,
        parameters: {
          coefficients: [1, this.getRandomInt(1, 5), this.getRandomInt(0, 3)],
        },
        description: 'Polynomial sequence',
      },
    ];

    const availablePatterns = patterns.filter((p) => {
      switch (this.difficulty) {
        case 1:
          return p.type === 'arithmetic';
        case 2:
          return ['arithmetic', 'geometric'].includes(p.type);
        case 3:
          return ['arithmetic', 'geometric', 'fibonacci'].includes(p.type);
        default:
          return true;
      }
    });

    return availablePatterns[
      Math.floor(Math.random() * availablePatterns.length)
    ];
  }

  private getTargetLength(): number {
    switch (this.difficulty) {
      case 1:
        return 8; // Beginner
      case 2:
        return 10; // Easy
      case 3:
        return 12; // Medium
      default:
        return 15; // Hard+
    }
  }

  private generateSequence(
    pattern: SequencePattern,
    length: number,
  ): SequenceElement[] {
    const sequence: SequenceElement[] = [];

    for (let i = 0; i < length; i++) {
      const value = this.calculateSequenceValue(pattern, i);
      sequence.push({
        value,
        position: i,
        isVisible: true,
        isUserFilled: false,
      });
    }

    return sequence;
  }

  private calculateSequenceValue(
    pattern: SequencePattern,
    position: number,
  ): number {
    switch (pattern.type) {
      case 'arithmetic':
        return 1 + position * pattern.parameters.difference;

      case 'geometric':
        return Math.pow(pattern.parameters.ratio, position);

      case 'fibonacci':
        if (position === 0) return 1;
        if (position === 1) return 1;
        let a = 1,
          b = 1;
        for (let i = 2; i <= position; i++) {
          const temp = a + b;
          a = b;
          b = temp;
        }
        return b;

      case 'polynomial':
        const coeffs = pattern.parameters.coefficients;
        let result = 0;
        for (let i = 0; i < coeffs.length; i++) {
          result += coeffs[i] * Math.pow(position, i);
        }
        return result;

      default:
        return position + 1;
    }
  }

  private hideSequenceElements(sequence: SequenceElement[]): void {
    const hideCount = Math.ceil(
      sequence.length * (0.3 + this.difficulty * 0.1),
    );
    const indicesToHide = this.getRandomIndices(sequence.length, hideCount);

    indicesToHide.forEach((index) => {
      sequence[index].isVisible = false;
    });
  }

  private getRandomIndices(length: number, count: number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    const selected: number[] = [];

    for (let i = 0; i < count && indices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * indices.length);
      const removedElement = indices.splice(randomIndex, 1)[0];
      selected.push(removedElement);
    }

    return selected.sort((a, b) => a - b);
  }

  private findFirstHiddenPosition(sequence: SequenceElement[]): number {
    return sequence.findIndex((el) => !el.isVisible);
  }

  private setDifficultyConstraints(): void {
    switch (this.difficulty) {
      case 1: // Beginner
        this.maxMoves = 10;
        this.timeLimit = 5 * 60 * 1000; // 5 minutes
        break;
      case 2: // Easy
        this.maxMoves = 8;
        this.timeLimit = 4 * 60 * 1000;
        break;
      case 3: // Medium
        this.maxMoves = 6;
        this.timeLimit = 3 * 60 * 1000;
        break;
      default: // Hard+
        this.maxMoves = 5;
        this.timeLimit = 2 * 60 * 1000;
        break;
    }
  }

  async makeMove(move: PuzzleMove): Promise<ValidationResult> {
    this.saveStateForUndo();

    const validation = await this.validateMoveInternal(move);

    if (validation.isValid) {
      await this.applyMoveInternal(move);
    }

    return validation;
  }

  protected async validateMoveInternal(
    move: PuzzleMove,
  ): Promise<ValidationResult> {
    const baseValidation = await this.validateMoveBase(move);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const { position, value } = move.moveData;
    const errors = [...baseValidation.errors];

    // Validate position
    if (
      !this.puzzleState ||
      position < 0 ||
      position >= this.puzzleState.sequence.length
    ) {
      errors.push({
        type: 'invalid_position',
        message: 'Position is out of bounds',
        element: `position-${position}`,
        severity: 'high',
      });
    }

    // Check if position is hidden (can be filled)
    const element = this.puzzleState?.sequence[position];
    if (element && element.isVisible) {
      errors.push({
        type: 'position_not_hidden',
        message: 'Cannot modify visible sequence elements',
        element: `position-${position}`,
        severity: 'high',
      });
    }

    // Validate value type
    if (typeof value !== 'number') {
      errors.push({
        type: 'invalid_value_type',
        message: 'Value must be a number',
        element: `position-${position}`,
        severity: 'high',
      });
    }

    return {
      ...baseValidation,
      isValid: errors.length === 0,
      errors,
    };
  }

  protected async applyMoveInternal(move: PuzzleMove): Promise<void> {
    if (!this.puzzleState || !this.gameState) return;

    const { position, value } = move.moveData;
    const element = this.puzzleState.sequence[position];

    // Apply the move
    element.value = value;
    element.isUserFilled = true;
    element.isVisible = true;

    // Update current position to next hidden element
    this.puzzleState.currentPosition = this.findFirstHiddenPosition(
      this.puzzleState.sequence,
    );

    // Update game state
    this.gameState.currentState = this.puzzleState;
    this.gameState.score = this.calculateSequenceScore();

    if (this.isComplete()) {
      this.gameState.status = PuzzleStatus.COMPLETED;
      this.endTimer();
    }
  }

  private calculateSequenceScore(): number {
    if (!this.puzzleState || !this.gameState) return 0;

    let baseScore = this.calculateBaseScore();

    // Bonus for correct answers
    let correctCount = 0;
    let totalHidden = 0;

    for (const element of this.puzzleState.sequence) {
      if (element.isUserFilled) {
        totalHidden++;
        const expectedValue = this.calculateSequenceValue(
          this.puzzleState.pattern,
          element.position,
        );
        if (element.value === expectedValue) {
          correctCount++;
        }
      }
    }

    if (totalHidden > 0) {
      const accuracy = correctCount / totalHidden;
      baseScore *= accuracy;
    }

    return Math.round(baseScore);
  }

  protected checkCompletionInternal(): boolean {
    if (!this.puzzleState) return false;

    // Check if all hidden elements are filled correctly
    for (const element of this.puzzleState.sequence) {
      if (!element.isVisible && !element.isUserFilled) {
        return false;
      }

      if (element.isUserFilled) {
        const expectedValue = this.calculateSequenceValue(
          this.puzzleState.pattern,
          element.position,
        );
        if (element.value !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }

  isComplete(): boolean {
    return this.checkCompletionInternal();
  }

  protected checkSolvabilityInternal(): boolean {
    // Sequence puzzles are always solvable if the pattern is deterministic
    return this.puzzleState !== null;
  }

  isSolvable(): boolean {
    return this.checkSolvabilityInternal();
  }

  getType(): PuzzleType {
    return PuzzleType.SEQUENCE;
  }

  validateSolution(solution: any): boolean {
    if (!solution || !Array.isArray(solution.values)) {
      return false;
    }
    
    if (!this.puzzleState) return false;
    
    // For simplicity, just check if values match the expected hidden values
    const hiddenElements = this.puzzleState.sequence.filter(elem => !elem.isVisible);
    if (solution.values.length !== hiddenElements.length) {
      return false;
    }
    
    // Check if each provided value matches the expected value
    for (let i = 0; i < solution.values.length; i++) {
      if (solution.values[i] !== hiddenElements[i].value) {
        return false;
      }
    }
    
    return true;
  }

  getSolution(): any {
    if (!this.puzzleState) return null;
    
    const hiddenValues = this.puzzleState.sequence
      .filter(elem => !elem.isVisible)
      .map(elem => elem.value);
      
    return {
      values: hiddenValues,
      pattern: this.puzzleState.pattern
    };
  }

  getCurrentState(): any {
    return {
      sequence: this.puzzleState?.sequence || [],
      pattern: this.puzzleState?.pattern || 'unknown',
      completed: this.isComplete()
    };
  }

  async generateHint(level: number): Promise<PuzzleHint> {
    if (!this.puzzleState) {
      throw new Error('Puzzle not initialized');
    }

    let content: string;
    let targetElements: string[] = [];

    switch (level) {
      case 1:
        content = `This is a ${this.puzzleState.pattern.description}`;
        break;

      case 2:
        content = this.getPatternHint();
        break;

      case 3:
        const nextPosition = this.puzzleState.currentPosition;
        if (nextPosition !== -1) {
          const expectedValue = this.calculateSequenceValue(
            this.puzzleState.pattern,
            nextPosition,
          );
          content = `The next value at position ${nextPosition + 1} should be ${expectedValue}`;
          targetElements = [`position-${nextPosition}`];
        } else {
          content = 'Check your answers - some might be incorrect';
        }
        break;

      default:
        content = 'Look for relationships between consecutive numbers';
        break;
    }

    return this.generateBasicHint(level, content, targetElements);
  }

  private getPatternHint(): string {
    if (!this.puzzleState) return 'Look for patterns';

    switch (this.puzzleState.pattern.type) {
      case 'arithmetic':
        return `Each number increases by ${this.puzzleState.pattern.parameters.difference}`;
      case 'geometric':
        return `Each number is multiplied by ${this.puzzleState.pattern.parameters.ratio}`;
      case 'fibonacci':
        return 'Each number is the sum of the two previous numbers';
      case 'polynomial':
        return 'The differences between consecutive terms follow a pattern';
      default:
        return 'Look for mathematical relationships';
    }
  }

  clone(): IPuzzle {
    const cloned = new SequencePuzzle();
    cloned.difficulty = this.difficulty;
    cloned.timeLimit = this.timeLimit;
    cloned.maxMoves = this.maxMoves;
    cloned.tags = [...this.tags];
    cloned.metadata = { ...this.metadata };

    if (this.puzzleState) {
      cloned.puzzleState = {
        ...this.puzzleState,
        sequence: this.puzzleState.sequence.map((el) => ({ ...el })),
        pattern: { ...this.puzzleState.pattern },
      };
    }

    if (this.gameState) {
      cloned.gameState = { ...this.gameState, puzzleId: cloned.id };
    }

    return cloned;
  }

  protected generateInitialState(config?: any): any {
    return this.puzzleState;
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
