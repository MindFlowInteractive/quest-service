import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { gameEngineConfig } from '../config/game-engine.config';
import type { ConfigType } from '@nestjs/config';
import {
  PuzzleType,
  DifficultyLevel,
  PuzzleMove,
  PuzzleStatus,
} from '../types/puzzle.types';
import { GameMode } from '../types/move-history.types';
import type { MoveHistorySnapshot } from '../types/move-history.types';
import { EnergyService } from '../../energy/energy.service';
import { MoveHistoryService } from './move-history.service';
import { StateManagementService } from './state-management.service';

@Injectable()
export class PuzzleEngineService {
  private puzzleTypes: Map<string, any> = new Map();

  constructor(
    @Inject(gameEngineConfig.KEY)
    private readonly config: ConfigType<typeof gameEngineConfig>,
    private readonly energyService: EnergyService,
    private readonly moveHistory: MoveHistoryService,
    private readonly stateManagement: StateManagementService,
  ) {}

  async createPuzzle(
    type: PuzzleType,
    playerId: string,
    difficulty?: DifficultyLevel,
    config?: any,
    mode?: GameMode,
  ): Promise<any> {
    // Calculate energy cost based on puzzle type and difficulty
    const energyCost = this.calculateEnergyCost(type, difficulty);

    // Check and consume energy
    const energyResult = await this.energyService.consumeEnergy(
      playerId,
      energyCost,
      null, // Will be set to puzzle ID after creation
      'puzzle',
      { puzzleType: type, difficulty },
    );

    if (!energyResult.success) {
      throw new BadRequestException(
        `Insufficient energy. Need ${energyCost}, have ${
          energyResult.currentEnergy
        }. Next regeneration at ${energyResult.nextRegenerationAt.toISOString()}`,
      );
    }

    const puzzleId = 'puzzle-' + Date.now();

    // Update the energy transaction with the actual puzzle ID
    // This would typically be done through a proper transaction system

    // Start the move history for this session so undo/redo and the replay
    // history are available from the very first move.
    this.moveHistory.startSession(puzzleId, playerId, {
      puzzleType: type,
      mode,
      initialState: {
        puzzleId,
        playerId,
        status: PuzzleStatus.IN_PROGRESS,
        currentState: {
          type,
          difficulty: difficulty ?? DifficultyLevel.MEDIUM,
        },
        moves: [],
        startTime: new Date(),
        score: 0,
        hintsUsed: 0,
        metadata: {},
      },
    });

    return {
      id: puzzleId,
      type,
      playerId,
      difficulty,
      config,
      energyCost,
      remainingEnergy: energyResult.currentEnergy,
      undoPolicy: this.moveHistory.getPolicy(puzzleId, playerId),
    };
  }

  private calculateEnergyCost(
    type: PuzzleType,
    difficulty?: DifficultyLevel,
  ): number {
    let baseCost = 10; // Default energy cost

    // Adjust cost based on puzzle type
    switch (type) {
      case PuzzleType.WORD_PUZZLE:
        baseCost = 5;
        break;
      case PuzzleType.PATTERN_MATCHING:
        baseCost = 8;
        break;
      case PuzzleType.SPATIAL:
        baseCost = 10;
        break;
      case PuzzleType.MATHEMATICAL:
        baseCost = 12;
        break;
      case PuzzleType.SEQUENCE:
        baseCost = 15;
        break;
      case PuzzleType.LOGIC_GRID:
        baseCost = 20;
        break;
      case PuzzleType.CUSTOM:
        baseCost = 15;
        break;
      default:
        baseCost = 10;
    }

    // Adjust cost based on difficulty
    const difficultyMultiplier = {
      [DifficultyLevel.BEGINNER]: 0.6,
      [DifficultyLevel.EASY]: 0.8,
      [DifficultyLevel.MEDIUM]: 1.0,
      [DifficultyLevel.HARD]: 1.3,
      [DifficultyLevel.EXPERT]: 1.6,
      [DifficultyLevel.MASTER]: 2.0,
      [DifficultyLevel.LEGENDARY]: 2.5,
      [DifficultyLevel.IMPOSSIBLE]: 3.0,
    };

    const multiplier = difficulty
      ? difficultyMultiplier[difficulty] || 1.0
      : 1.0;
    return Math.ceil(baseCost * multiplier);
  }

  async loadPuzzle(puzzleId: string, playerId: string): Promise<any> {
    return { id: puzzleId, playerId, state: 'loaded' };
  }

  async makeMove(
    puzzleId: string,
    playerId: string,
    move: PuzzleMove,
  ): Promise<any> {
    const entry = this.moveHistory.recordMove(puzzleId, playerId, move);

    let moveCount = 0;
    const history = this.moveHistory.getHistory(puzzleId, playerId);
    if (history) {
      const current = history.states[history.cursor];
      if (current) {
        moveCount = current.moves.length;
        await this.stateManagement.saveState(current);
      }
    }

    return {
      puzzleId,
      playerId,
      move,
      success: true,
      sequence: entry.sequence,
      moveCount,
    };
  }

  /**
   * Undoes the most recent move and persists the restored state.
   */
  async undoMove(
    puzzleId: string,
    playerId: string,
  ): Promise<MoveHistorySnapshot> {
    const result = this.moveHistory.undo(puzzleId, playerId);
    await this.stateManagement.saveState(result.state);
    return result;
  }

  /**
   * Redoes the most recently undone move and persists the restored state.
   */
  async redoMove(
    puzzleId: string,
    playerId: string,
  ): Promise<MoveHistorySnapshot> {
    const result = this.moveHistory.redo(puzzleId, playerId);
    await this.stateManagement.saveState(result.state);
    return result;
  }

  /**
   * The move history of a session, together with the rules that apply to it.
   */
  getMoveHistory(puzzleId: string, playerId: string) {
    const history = this.moveHistory.getHistory(puzzleId, playerId);

    return {
      entries: history?.entries ?? [],
      undoCount: history?.undoCount ?? 0,
      redoCount: history?.redoCount ?? 0,
      totalPenalty: history?.totalPenalty ?? 0,
      policy: this.moveHistory.getPolicy(puzzleId, playerId),
    };
  }

  async validateSolution(puzzleId: string, solution: any): Promise<boolean> {
    return true;
  }

  async getPuzzleState(puzzleId: string, playerId?: string): Promise<any> {
    return { id: puzzleId, playerId, state: 'active' };
  }

  async resetPuzzle(puzzleId: string, playerId: string): Promise<void> {
    // Reset puzzle state
    this.moveHistory.clearSession(puzzleId, playerId);
  }

  async abandonPuzzle(puzzleId: string, playerId: string): Promise<void> {
    // Mark puzzle as abandoned
  }

  async getActivePuzzles(playerId: string): Promise<any[]> {
    return [];
  }

  async clonePuzzle(
    puzzleId: string,
    playerId: string,
    newPlayerId: string,
  ): Promise<any> {
    return {
      id: 'puzzle-clone-' + Date.now(),
      originalId: puzzleId,
      playerId: newPlayerId,
    };
  }

  registerPuzzleType(name: string, handler: any): void {
    this.puzzleTypes.set(name, handler);
  }
}
