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

interface LogicGridCell {
  row: number;
  col: number;
  value: string | null;
  isGiven: boolean;
  possibleValues: string[];
}

interface LogicGridState {
  grid: LogicGridCell[][];
  rules: LogicGridRule[];
  categories: string[];
  items: string[];
  size: number;
}

interface LogicGridRule {
  id: string;
  type: 'direct' | 'exclusion' | 'conditional';
  description: string;
  constraint: (grid: LogicGridCell[][]) => boolean;
}

/**
 * Logic Grid Puzzle Implementation
 * Players must use logical deduction to match items across categories
 */
export class LogicGridPuzzle extends BasePuzzle {
  public readonly type: PuzzleType = PuzzleType.LOGIC_GRID;
  public title: string = 'Logic Grid Puzzle';
  public description: string =
    'Use logical deduction to match items across categories';

  private puzzleState: LogicGridState | null = null;

  async initialize(config?: any): Promise<void> {
    const defaultConfig = {
      size: 3,
      categories: ['Names', 'Ages', 'Colors'],
      items: {
        Names: ['Alice', 'Bob', 'Carol'],
        Ages: ['25', '30', '35'],
        Colors: ['Red', 'Blue', 'Green'],
      },
      rules: [],
    };

    const puzzleConfig = { ...defaultConfig, ...config };

    // Generate initial grid
    const grid: LogicGridCell[][] = [];
    for (let row = 0; row < puzzleConfig.size; row++) {
      grid[row] = [];
      for (let col = 0; col < puzzleConfig.size; col++) {
        grid[row][col] = {
          row,
          col,
          value: null,
          isGiven: false,
          possibleValues: [
            ...puzzleConfig.items[
              puzzleConfig.categories[col] as keyof typeof puzzleConfig.items
            ],
          ],
        };
      }
    }

    this.puzzleState = {
      grid,
      rules: this.generateRules(puzzleConfig),
      categories: puzzleConfig.categories,
      items: puzzleConfig.items[Object.keys(puzzleConfig.items)[0]],
      size: puzzleConfig.size,
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

    this.logger.log(`Initialized Logic Grid puzzle ${this.id}`);
  }

  private generateRules(config: any): LogicGridRule[] {
    const rules: LogicGridRule[] = [];

    // Add some example rules based on difficulty
    if (this.difficulty >= 2) {
      rules.push({
        id: uuidv4(),
        type: 'direct',
        description: 'Alice is not 25 years old',
        constraint: (grid) => {
          const aliceRow = this.findItemRow(grid, 'Alice');
          const ageCol = this.findCategoryColumn('Ages');
          return (
            aliceRow === -1 ||
            ageCol === -1 ||
            grid[aliceRow][ageCol].value !== '25'
          );
        },
      });
    }

    if (this.difficulty >= 3) {
      rules.push({
        id: uuidv4(),
        type: 'conditional',
        description:
          'The person with Red color is older than the person with Blue color',
        constraint: (grid) => {
          // Complex rule validation logic would go here
          return true; // Simplified for now
        },
      });
    }

    return rules;
  }

  private setDifficultyConstraints(): void {
    switch (this.difficulty) {
      case 1: // Beginner
        this.maxMoves = 15;
        this.timeLimit = 10 * 60 * 1000; // 10 minutes
        break;
      case 2: // Easy
        this.maxMoves = 12;
        this.timeLimit = 8 * 60 * 1000;
        break;
      case 3: // Medium
        this.maxMoves = 10;
        this.timeLimit = 6 * 60 * 1000;
        break;
      default: // Hard+
        this.maxMoves = 8;
        this.timeLimit = 5 * 60 * 1000;
        break;
    }
  }

  async makeMove(move: PuzzleMove): Promise<ValidationResult> {
    // Save state for undo
    this.saveStateForUndo();

    // Validate move
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

    const { row, col, value } = move.moveData;
    const errors = [...baseValidation.errors];

    // Validate grid bounds
    if (
      !this.puzzleState ||
      row < 0 ||
      row >= this.puzzleState.size ||
      col < 0 ||
      col >= this.puzzleState.size
    ) {
      errors.push({
        type: 'invalid_position',
        message: 'Position is out of bounds',
        element: `cell-${row}-${col}`,
        severity: 'high',
      });
    }

    // Validate value is allowed
    const cell = this.puzzleState?.grid[row][col];
    if (cell && !cell.possibleValues.includes(value)) {
      errors.push({
        type: 'invalid_value',
        message: 'Value not allowed in this cell',
        element: `cell-${row}-${col}`,
        severity: 'high',
      });
    }

    // Check rules compliance
    if (this.puzzleState && errors.length === 0) {
      const tempGrid = this.cloneGrid(this.puzzleState.grid);
      tempGrid[row][col].value = value;

      for (const rule of this.puzzleState.rules) {
        if (!rule.constraint(tempGrid)) {
          errors.push({
            type: 'rule_violation',
            message: `Move violates rule: ${rule.description}`,
            element: `rule-${rule.id}`,
            severity: 'medium',
          });
        }
      }
    }

    return {
      ...baseValidation,
      isValid: errors.length === 0,
      errors,
    };
  }

  protected async applyMoveInternal(move: PuzzleMove): Promise<void> {
    if (!this.puzzleState || !this.gameState) return;

    const { row, col, value } = move.moveData;

    // Apply the move
    this.puzzleState.grid[row][col].value = value;

    // Update possible values for related cells
    this.updatePossibleValues(row, col, value);

    // Update game state
    this.gameState.currentState = this.puzzleState;
    this.gameState.score = this.calculateBaseScore();

    if (this.isComplete()) {
      this.gameState.status = PuzzleStatus.COMPLETED;
      this.endTimer();
    }
  }

  private updatePossibleValues(row: number, col: number, value: string): void {
    if (!this.puzzleState) return;

    // Remove value from same row and column in different categories
    for (let c = 0; c < this.puzzleState.size; c++) {
      if (c !== col) {
        const cell = this.puzzleState.grid[row][c];
        cell.possibleValues = cell.possibleValues.filter((v) => v !== value);
      }
    }

    for (let r = 0; r < this.puzzleState.size; r++) {
      if (r !== row) {
        const cell = this.puzzleState.grid[r][col];
        cell.possibleValues = cell.possibleValues.filter((v) => v !== value);
      }
    }
  }

  protected checkCompletionInternal(): boolean {
    if (!this.puzzleState) return false;

    // Check if all cells are filled
    for (let row = 0; row < this.puzzleState.size; row++) {
      for (let col = 0; col < this.puzzleState.size; col++) {
        if (this.puzzleState.grid[row][col].value === null) {
          return false;
        }
      }
    }

    // Check if all rules are satisfied
    return this.puzzleState.rules.every((rule) =>
      rule.constraint(this.puzzleState!.grid),
    );
  }

  isComplete(): boolean {
    return this.checkCompletionInternal();
  }

  protected checkSolvabilityInternal(): boolean {
    if (!this.puzzleState) return false;

    // Use backtracking to check if puzzle has a solution
    return this.canSolve(this.cloneGrid(this.puzzleState.grid));
  }

  isSolvable(): boolean {
    return this.checkSolvabilityInternal();
  }

  getType(): PuzzleType {
    return PuzzleType.LOGIC_GRID;
  }

  validateSolution(solution: any): boolean {
    if (!solution || !solution.grid) {
      return false;
    }
    
    // Check if all rules are satisfied using the same logic as completion check
    return this.puzzleState?.rules.every((rule) =>
      rule.constraint(solution.grid)
    ) || false;
  }

  getSolution(): any {
    // Generate a valid solution by solving the puzzle
    if (this.puzzleState) {
      const solutionGrid = this.cloneGrid(this.puzzleState.grid);
      if (this.canSolve(solutionGrid)) {
        return {
          grid: solutionGrid,
          rules: this.puzzleState.rules
        };
      }
    }
    return null;
  }

  getCurrentState(): any {
    return {
      grid: this.puzzleState?.grid || null,
      rules: this.puzzleState?.rules || [],
      completed: this.isComplete()
    };
  }

  private canSolve(
    grid: LogicGridCell[][],
    row: number = 0,
    col: number = 0,
  ): boolean {
    if (!this.puzzleState) return false;

    if (row === this.puzzleState.size) return true;

    const nextCol = col + 1;
    const nextRow = nextCol === this.puzzleState.size ? row + 1 : row;
    const adjustedNextCol = nextCol === this.puzzleState.size ? 0 : nextCol;

    const cell = grid[row][col];
    if (cell.value !== null) {
      return this.canSolve(grid, nextRow, adjustedNextCol);
    }

    for (const value of cell.possibleValues) {
      cell.value = value;

      if (
        this.isValidPlacement(grid, row, col, value) &&
        this.canSolve(grid, nextRow, adjustedNextCol)
      ) {
        return true;
      }

      cell.value = null;
    }

    return false;
  }

  private isValidPlacement(
    grid: LogicGridCell[][],
    row: number,
    col: number,
    value: string,
  ): boolean {
    if (!this.puzzleState) return false;

    // Check rules
    for (const rule of this.puzzleState.rules) {
      if (!rule.constraint(grid)) {
        return false;
      }
    }

    return true;
  }

  async generateHint(level: number): Promise<PuzzleHint> {
    if (!this.puzzleState) {
      throw new Error('Puzzle not initialized');
    }

    let content: string;
    let targetElements: string[] = [];

    switch (level) {
      case 1:
        content = 'Look for cells where only one value is possible';
        const singlePossibility = this.findCellWithSinglePossibility();
        if (singlePossibility) {
          targetElements = [
            `cell-${singlePossibility.row}-${singlePossibility.col}`,
          ];
        }
        break;

      case 2:
        content = 'Check which rules eliminate certain possibilities';
        const violatedRule = this.puzzleState.rules[0];
        if (violatedRule) {
          targetElements = [`rule-${violatedRule.id}`];
          content = `Focus on this rule: ${violatedRule.description}`;
        }
        break;

      case 3:
        content = 'Try working backwards from completed rows or columns';
        const nextMove = this.findBestNextMove();
        if (nextMove) {
          targetElements = [`cell-${nextMove.row}-${nextMove.col}`];
          content = `Consider placing "${nextMove.value}" at row ${nextMove.row + 1}, column ${nextMove.col + 1}`;
        }
        break;

      default:
        content = 'Think about the logical relationships between categories';
        break;
    }

    return this.generateBasicHint(level, content, targetElements);
  }

  private findCellWithSinglePossibility(): { row: number; col: number } | null {
    if (!this.puzzleState) return null;

    for (let row = 0; row < this.puzzleState.size; row++) {
      for (let col = 0; col < this.puzzleState.size; col++) {
        const cell = this.puzzleState.grid[row][col];
        if (cell.value === null && cell.possibleValues.length === 1) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private findBestNextMove(): {
    row: number;
    col: number;
    value: string;
  } | null {
    if (!this.puzzleState) return null;

    // Find cell with fewest possibilities
    let bestCell: { row: number; col: number; value: string } | null = null;
    let minPossibilities = Infinity;

    for (let row = 0; row < this.puzzleState.size; row++) {
      for (let col = 0; col < this.puzzleState.size; col++) {
        const cell = this.puzzleState.grid[row][col];
        if (
          cell.value === null &&
          cell.possibleValues.length < minPossibilities
        ) {
          minPossibilities = cell.possibleValues.length;
          bestCell = { row, col, value: cell.possibleValues[0] };
        }
      }
    }

    return bestCell;
  }

  clone(): IPuzzle {
    const cloned = new LogicGridPuzzle();
    cloned.difficulty = this.difficulty;
    cloned.timeLimit = this.timeLimit;
    cloned.maxMoves = this.maxMoves;
    cloned.tags = [...this.tags];
    cloned.metadata = { ...this.metadata };

    if (this.puzzleState) {
      cloned.puzzleState = {
        ...this.puzzleState,
        grid: this.cloneGrid(this.puzzleState.grid),
        rules: [...this.puzzleState.rules],
        categories: [...this.puzzleState.categories],
        items: [...this.puzzleState.items],
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

  private cloneGrid(grid: LogicGridCell[][]): LogicGridCell[][] {
    return grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        possibleValues: [...cell.possibleValues],
      })),
    );
  }

  private findItemRow(grid: LogicGridCell[][], item: string): number {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col].value === item) {
          return row;
        }
      }
    }
    return -1;
  }

  private findCategoryColumn(category: string): number {
    if (!this.puzzleState) return -1;
    return this.puzzleState.categories.indexOf(category);
  }
}
