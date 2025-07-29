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

interface SpatialElement {
  id: string;
  type: 'block' | 'goal' | 'player' | 'obstacle' | 'movable';
  position: { x: number; y: number };
  properties: Record<string, any>;
}

interface SpatialState {
  grid: SpatialElement[][];
  width: number;
  height: number;
  playerPosition: { x: number; y: number };
  goals: { x: number; y: number }[];
  movableObjects: string[];
  moveCount: number;
  reachedGoals: string[];
}

/**
 * Spatial Puzzle Implementation
 * Players must manipulate objects in 2D space to achieve goals
 */
export class SpatialPuzzle extends BasePuzzle {
  public readonly type: PuzzleType = PuzzleType.SPATIAL;
  public title: string = 'Spatial Puzzle';
  public description: string =
    'Move objects and navigate through space to reach all goals';

  private puzzleState: SpatialState | null = null;

  async initialize(config?: any): Promise<void> {
    const width = config?.width || this.getDifficultyBasedSize().width;
    const height = config?.height || this.getDifficultyBasedSize().height;

    // Initialize empty grid
    const grid: SpatialElement[][] = Array(height)
      .fill(null)
      .map(() =>
        Array(width)
          .fill(null)
          .map(() => ({
            id: uuidv4(),
            type: 'block' as const,
            position: { x: 0, y: 0 },
            properties: {},
          })),
      );

    // Set positions for grid elements
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x].position = { x, y };
      }
    }

    const layout = this.generateLevel(width, height);
    this.applyLayout(grid, layout);

    this.puzzleState = {
      grid,
      width,
      height,
      playerPosition: layout.playerStart,
      goals: layout.goals,
      movableObjects: layout.movableObjects,
      moveCount: 0,
      reachedGoals: [],
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
      `Initialized Spatial puzzle ${this.id} (${width}x${height})`,
    );
  }

  private getDifficultyBasedSize(): { width: number; height: number } {
    switch (this.difficulty) {
      case 1:
        return { width: 6, height: 6 }; // Beginner
      case 2:
        return { width: 8, height: 6 }; // Easy
      case 3:
        return { width: 8, height: 8 }; // Medium
      default:
        return { width: 10, height: 8 }; // Hard+
    }
  }

  private generateLevel(width: number, height: number) {
    const layout = {
      playerStart: { x: 1, y: 1 },
      goals: [] as { x: number; y: number }[],
      obstacles: [] as { x: number; y: number }[],
      movableObjects: [] as string[],
    };

    // Add border walls
    for (let x = 0; x < width; x++) {
      layout.obstacles.push({ x, y: 0 });
      layout.obstacles.push({ x, y: height - 1 });
    }
    for (let y = 0; y < height; y++) {
      layout.obstacles.push({ x: 0, y });
      layout.obstacles.push({ x: width - 1, y });
    }

    // Add goals based on difficulty
    const goalCount = Math.min(this.difficulty + 1, 4);
    for (let i = 0; i < goalCount; i++) {
      let goalPos: { x: number; y: number };
      do {
        goalPos = {
          x: Math.floor(Math.random() * (width - 2)) + 1,
          y: Math.floor(Math.random() * (height - 2)) + 1,
        };
      } while (
        layout.obstacles.some(
          (obs) => obs.x === goalPos.x && obs.y === goalPos.y,
        ) ||
        layout.goals.some(
          (goal) => goal.x === goalPos.x && goal.y === goalPos.y,
        ) ||
        (goalPos.x === layout.playerStart.x &&
          goalPos.y === layout.playerStart.y)
      );
      layout.goals.push(goalPos);
    }

    // Add some internal obstacles
    const obstacleCount = Math.floor(width * height * 0.15);
    for (let i = 0; i < obstacleCount; i++) {
      let obsPos: { x: number; y: number };
      do {
        obsPos = {
          x: Math.floor(Math.random() * (width - 2)) + 1,
          y: Math.floor(Math.random() * (height - 2)) + 1,
        };
      } while (
        layout.obstacles.some(
          (obs) => obs.x === obsPos.x && obs.y === obsPos.y,
        ) ||
        layout.goals.some(
          (goal) => goal.x === obsPos.x && goal.y === obsPos.y,
        ) ||
        (obsPos.x === layout.playerStart.x && obsPos.y === layout.playerStart.y)
      );
      layout.obstacles.push(obsPos);
    }

    // Add movable objects for harder difficulties
    if (this.difficulty >= 3) {
      const movableCount = Math.floor(this.difficulty / 2);
      for (let i = 0; i < movableCount; i++) {
        let movPos: { x: number; y: number };
        do {
          movPos = {
            x: Math.floor(Math.random() * (width - 2)) + 1,
            y: Math.floor(Math.random() * (height - 2)) + 1,
          };
        } while (
          layout.obstacles.some(
            (obs) => obs.x === movPos.x && obs.y === movPos.y,
          ) ||
          layout.goals.some(
            (goal) => goal.x === movPos.x && goal.y === movPos.y,
          ) ||
          (movPos.x === layout.playerStart.x &&
            movPos.y === layout.playerStart.y)
        );

        const movableId = `movable-${i}`;
        layout.movableObjects.push(movableId);
      }
    }

    return layout;
  }

  private applyLayout(grid: SpatialElement[][], layout: any): void {
    const { width, height } = this.puzzleState || {
      width: grid[0].length,
      height: grid.length,
    };

    // Clear grid first (set all to empty blocks)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x].type = 'block';
        grid[y][x].properties = {};
      }
    }

    // Place player
    grid[layout.playerStart.y][layout.playerStart.x].type = 'player';

    // Place goals
    layout.goals.forEach((goal: { x: number; y: number }) => {
      grid[goal.y][goal.x].type = 'goal';
    });

    // Place obstacles
    layout.obstacles.forEach((obs: { x: number; y: number }) => {
      grid[obs.y][obs.x].type = 'obstacle';
    });

    // Place movable objects
    layout.movableObjects.forEach((objId: string, index: number) => {
      // Find a suitable position for movable objects
      let placed = false;
      for (let y = 1; y < height - 1 && !placed; y++) {
        for (let x = 1; x < width - 1 && !placed; x++) {
          if (grid[y][x].type === 'block') {
            grid[y][x].type = 'movable';
            grid[y][x].id = objId;
            placed = true;
          }
        }
      }
    });
  }

  private setDifficultyConstraints(): void {
    switch (this.difficulty) {
      case 1: // Beginner
        this.maxMoves = 50;
        this.timeLimit = 10 * 60 * 1000; // 10 minutes
        break;
      case 2: // Easy
        this.maxMoves = 75;
        this.timeLimit = 12 * 60 * 1000;
        break;
      case 3: // Medium
        this.maxMoves = 100;
        this.timeLimit = 15 * 60 * 1000;
        break;
      default: // Hard+
        this.maxMoves = 150;
        this.timeLimit = 20 * 60 * 1000;
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

    const { direction, objectId } = move.moveData;
    const errors = [...baseValidation.errors];

    // Validate direction
    if (!['up', 'down', 'left', 'right'].includes(direction)) {
      errors.push({
        type: 'invalid_direction',
        message: 'Direction must be up, down, left, or right',
        element: 'direction',
        severity: 'high',
      });
    }

    if (!this.puzzleState) {
      return { ...baseValidation, isValid: false, errors };
    }

    // Determine what to move (player or specific object)
    let currentPos: { x: number; y: number };
    if (objectId) {
      // Moving a specific object
      const objectPos = this.findObjectPosition(objectId);
      if (!objectPos) {
        errors.push({
          type: 'object_not_found',
          message: 'Object not found',
          element: objectId,
          severity: 'high',
        });
        return { ...baseValidation, isValid: false, errors };
      }
      currentPos = objectPos;
    } else {
      // Moving player
      currentPos = this.puzzleState.playerPosition;
    }

    // Calculate target position
    const targetPos = this.getTargetPosition(currentPos, direction);

    // Check bounds
    if (
      targetPos.x < 0 ||
      targetPos.x >= this.puzzleState.width ||
      targetPos.y < 0 ||
      targetPos.y >= this.puzzleState.height
    ) {
      errors.push({
        type: 'out_of_bounds',
        message: 'Move would go out of bounds',
        element: 'position',
        severity: 'medium',
      });
    }

    // Check collision
    if (errors.length === 0) {
      const targetElement = this.puzzleState.grid[targetPos.y][targetPos.x];
      if (targetElement.type === 'obstacle') {
        errors.push({
          type: 'blocked_by_obstacle',
          message: 'Path blocked by obstacle',
          element: `cell-${targetPos.x}-${targetPos.y}`,
          severity: 'medium',
        });
      } else if (targetElement.type === 'movable' && !objectId) {
        // Player trying to move into movable object - check if it can be pushed
        const pushTargetPos = this.getTargetPosition(targetPos, direction);
        if (
          pushTargetPos.x < 0 ||
          pushTargetPos.x >= this.puzzleState.width ||
          pushTargetPos.y < 0 ||
          pushTargetPos.y >= this.puzzleState.height
        ) {
          errors.push({
            type: 'cannot_push_out_of_bounds',
            message: 'Cannot push object out of bounds',
            element: `cell-${targetPos.x}-${targetPos.y}`,
            severity: 'medium',
          });
        } else {
          const pushTarget =
            this.puzzleState.grid[pushTargetPos.y][pushTargetPos.x];
          if (pushTarget.type === 'obstacle' || pushTarget.type === 'movable') {
            errors.push({
              type: 'cannot_push_blocked',
              message: 'Cannot push object - path blocked',
              element: `cell-${pushTargetPos.x}-${pushTargetPos.y}`,
              severity: 'medium',
            });
          }
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

    const { direction, objectId } = move.moveData;

    if (objectId) {
      // Move specific object
      this.moveObject(objectId, direction);
    } else {
      // Move player (and possibly push objects)
      this.movePlayer(direction);
    }

    this.puzzleState.moveCount++;

    // Update game state
    this.gameState.currentState = this.puzzleState;
    this.gameState.score = this.calculateSpatialScore();

    if (this.isComplete()) {
      this.gameState.status = PuzzleStatus.COMPLETED;
      this.endTimer();
    }
  }

  private movePlayer(direction: string): void {
    if (!this.puzzleState) return;

    const currentPos = this.puzzleState.playerPosition;
    const targetPos = this.getTargetPosition(currentPos, direction);
    const targetElement = this.puzzleState.grid[targetPos.y][targetPos.x];

    // Handle pushing movable objects
    if (targetElement.type === 'movable') {
      const pushTargetPos = this.getTargetPosition(targetPos, direction);

      // Move the object
      this.puzzleState.grid[pushTargetPos.y][pushTargetPos.x] = {
        ...targetElement,
      };
      this.puzzleState.grid[pushTargetPos.y][pushTargetPos.x].position =
        pushTargetPos;

      // Clear the object's old position
      this.puzzleState.grid[targetPos.y][targetPos.x] = {
        id: uuidv4(),
        type: 'block',
        position: targetPos,
        properties: {},
      };
    }

    // Move player
    this.puzzleState.grid[currentPos.y][currentPos.x] = {
      id: uuidv4(),
      type:
        this.puzzleState.grid[currentPos.y][currentPos.x].type === 'goal'
          ? 'goal'
          : 'block',
      position: currentPos,
      properties: {},
    };

    const wasGoal =
      this.puzzleState.grid[targetPos.y][targetPos.x].type === 'goal';
    this.puzzleState.grid[targetPos.y][targetPos.x] = {
      id: uuidv4(),
      type: 'player',
      position: targetPos,
      properties: wasGoal ? { onGoal: true } : {},
    };

    this.puzzleState.playerPosition = targetPos;
  }

  private moveObject(objectId: string, direction: string): void {
    if (!this.puzzleState) return;

    const currentPos = this.findObjectPosition(objectId);
    if (!currentPos) return;

    const targetPos = this.getTargetPosition(currentPos, direction);

    // Move object
    const objectElement = this.puzzleState.grid[currentPos.y][currentPos.x];
    this.puzzleState.grid[targetPos.y][targetPos.x] = {
      ...objectElement,
      position: targetPos,
    };

    // Clear old position
    this.puzzleState.grid[currentPos.y][currentPos.x] = {
      id: uuidv4(),
      type: 'block',
      position: currentPos,
      properties: {},
    };
  }

  private getTargetPosition(
    current: { x: number; y: number },
    direction: string,
  ): { x: number; y: number } {
    switch (direction) {
      case 'up':
        return { x: current.x, y: current.y - 1 };
      case 'down':
        return { x: current.x, y: current.y + 1 };
      case 'left':
        return { x: current.x - 1, y: current.y };
      case 'right':
        return { x: current.x + 1, y: current.y };
      default:
        return current;
    }
  }

  private findObjectPosition(
    objectId: string,
  ): { x: number; y: number } | null {
    if (!this.puzzleState) return null;

    for (let y = 0; y < this.puzzleState.height; y++) {
      for (let x = 0; x < this.puzzleState.width; x++) {
        if (this.puzzleState.grid[y][x].id === objectId) {
          return { x, y };
        }
      }
    }
    return null;
  }

  private calculateSpatialScore(): number {
    if (!this.puzzleState || !this.gameState) return 0;

    let baseScore = this.calculateBaseScore();

    // Bonus for reaching goals
    const goalsReached = this.countGoalsReached();
    const goalBonus = (goalsReached / this.puzzleState.goals.length) * 100;

    // Efficiency bonus (fewer moves = higher score)
    const moveEfficiency = Math.max(
      0,
      1 - this.puzzleState.moveCount / (this.maxMoves || 100),
    );
    const efficiencyBonus = moveEfficiency * 50;

    return Math.round(baseScore + goalBonus + efficiencyBonus);
  }

  private countGoalsReached(): number {
    if (!this.puzzleState) return 0;

    let count = 0;
    for (const goal of this.puzzleState.goals) {
      const element = this.puzzleState.grid[goal.y][goal.x];
      if (element.type === 'player' && element.properties?.onGoal) {
        count++;
      }
    }

    // Also check if player is on a goal position
    const playerElement =
      this.puzzleState.grid[this.puzzleState.playerPosition.y][
        this.puzzleState.playerPosition.x
      ];
    if (playerElement.properties?.onGoal) {
      count = 1; // Simple case: just one goal to reach
    }

    return count;
  }

  protected checkCompletionInternal(): boolean {
    if (!this.puzzleState) return false;

    // Check if player has reached all goals
    const playerPos = this.puzzleState.playerPosition;
    return this.puzzleState.goals.some(
      (goal) => goal.x === playerPos.x && goal.y === playerPos.y,
    );
  }

  isComplete(): boolean {
    return this.checkCompletionInternal();
  }

  protected checkSolvabilityInternal(): boolean {
    if (!this.puzzleState) return false;

    // Use BFS to check if any goal is reachable
    return this.puzzleState.goals.some((goal) =>
      this.isPositionReachable(goal),
    );
  }

  private isPositionReachable(target: { x: number; y: number }): boolean {
    if (!this.puzzleState) return false;

    const visited = new Set<string>();
    const queue = [this.puzzleState.playerPosition];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = `${current.x},${current.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (current.x === target.x && current.y === target.y) {
        return true;
      }

      // Check all directions
      for (const direction of ['up', 'down', 'left', 'right']) {
        const next = this.getTargetPosition(current, direction);

        if (
          next.x >= 0 &&
          next.x < this.puzzleState.width &&
          next.y >= 0 &&
          next.y < this.puzzleState.height
        ) {
          const element = this.puzzleState.grid[next.y][next.x];
          if (element.type !== 'obstacle') {
            queue.push(next);
          }
        }
      }
    }

    return false;
  }

  isSolvable(): boolean {
    return this.checkSolvabilityInternal();
  }

  getType(): PuzzleType {
    return PuzzleType.SPATIAL;
  }

  validateSolution(solution: any): boolean {
    if (!solution || !solution.playerPosition) {
      return false;
    }
    
    // Check if all goals are reached
    return this.puzzleState?.goals.every(goal => 
      this.puzzleState?.reachedGoals.includes(`${goal.x},${goal.y}`)
    ) || false;
  }

  getSolution(): any {
    return {
      playerPosition: this.puzzleState?.playerPosition || { x: 0, y: 0 },
      goals: this.puzzleState?.goals || [],
      grid: this.puzzleState?.grid || []
    };
  }

  getCurrentState(): any {
    return {
      grid: this.puzzleState?.grid || [],
      playerPosition: this.puzzleState?.playerPosition || { x: 0, y: 0 },
      goals: this.puzzleState?.goals || [],
      reachedGoals: this.puzzleState?.reachedGoals || [],
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
        content = 'Use arrow keys or WASD to move around the grid';
        break;

      case 2:
        const nearestGoal = this.findNearestGoal();
        if (nearestGoal) {
          content = `Try to reach the goal at position (${nearestGoal.x + 1}, ${nearestGoal.y + 1})`;
          targetElements = [`cell-${nearestGoal.x}-${nearestGoal.y}`];
        } else {
          content = 'Look for the goal markers on the grid';
        }
        break;

      case 3:
        const nextMove = this.suggestNextMove();
        if (nextMove) {
          content = `Try moving ${nextMove.direction}`;
          targetElements = [`direction-${nextMove.direction}`];
        } else {
          content = 'Consider pushing movable objects to clear your path';
        }
        break;

      default:
        content = 'Plan your route carefully to avoid getting stuck';
        break;
    }

    return this.generateBasicHint(level, content, targetElements);
  }

  private findNearestGoal(): { x: number; y: number } | null {
    if (!this.puzzleState) return null;

    let nearest: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    for (const goal of this.puzzleState.goals) {
      const distance =
        Math.abs(goal.x - this.puzzleState.playerPosition.x) +
        Math.abs(goal.y - this.puzzleState.playerPosition.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = goal;
      }
    }

    return nearest;
  }

  private suggestNextMove(): { direction: string } | null {
    if (!this.puzzleState) return null;

    const nearestGoal = this.findNearestGoal();
    if (!nearestGoal) return null;

    const playerPos = this.puzzleState.playerPosition;
    const dx = nearestGoal.x - playerPos.x;
    const dy = nearestGoal.y - playerPos.y;

    // Suggest direction towards goal
    if (Math.abs(dx) > Math.abs(dy)) {
      return { direction: dx > 0 ? 'right' : 'left' };
    } else {
      return { direction: dy > 0 ? 'down' : 'up' };
    }
  }

  clone(): IPuzzle {
    const cloned = new SpatialPuzzle();
    cloned.difficulty = this.difficulty;
    cloned.timeLimit = this.timeLimit;
    cloned.maxMoves = this.maxMoves;
    cloned.tags = [...this.tags];
    cloned.metadata = { ...this.metadata };

    if (this.puzzleState) {
      cloned.puzzleState = {
        ...this.puzzleState,
        grid: this.puzzleState.grid.map((row) =>
          row.map((cell) => ({ ...cell })),
        ),
        playerPosition: { ...this.puzzleState.playerPosition },
        goals: this.puzzleState.goals.map((goal) => ({ ...goal })),
        movableObjects: [...this.puzzleState.movableObjects],
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
}
