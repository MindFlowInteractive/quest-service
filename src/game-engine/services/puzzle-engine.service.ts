import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ConfigType } from "@nestjs/config"
import type { IPuzzle, PuzzleGameState } from "../interfaces/puzzle.interfaces"
import type { PuzzleMove, ValidationResult, PuzzleType, DifficultyLevel } from "../types/puzzle.types"
import { PuzzleStatus } from "../types/puzzle.types"
import type { PuzzleState } from "../entities/puzzle-state.entity"
import type { StateManagementService } from "./state-management.service"
import type { ValidationService } from "./validation.service"
import type { CauseEffectEngineService } from "./cause-effect-engine.service"
import type { AnalyticsService } from "./analytics.service"
import type { gameEngineConfig } from "../config/game-engine.config"
import { Inject } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"

@Injectable()
export class PuzzleEngineService {
  private readonly logger = new Logger(PuzzleEngineService.name)
  private readonly puzzleRegistry = new Map<string, () => IPuzzle>()
  private readonly activePuzzles = new Map<string, IPuzzle>()

  constructor(
    private readonly puzzleStateRepository: Repository<PuzzleState>,
    private readonly stateManagement: StateManagementService,
    private readonly validation: ValidationService,
    private readonly causeEffectEngine: CauseEffectEngineService,
    private readonly analytics: AnalyticsService,
    private readonly config: ConfigType<typeof gameEngineConfig>,
    @Inject('REPLAY_SERVICE') private readonly replayClient: ClientProxy,
  ) {}

  registerPuzzleType(type: PuzzleType, factory: () => IPuzzle): void {
    this.puzzleRegistry.set(type, factory)
    this.logger.log(`Registered puzzle type: ${type}`)
  }

  async createPuzzle(type: PuzzleType, playerId: string, difficulty: DifficultyLevel, config?: any): Promise<IPuzzle> {
    const factory = this.puzzleRegistry.get(type)
    if (!factory) {
      throw new NotFoundException(`Puzzle type ${type} not registered`)
    }

    const puzzle = factory()
    puzzle.difficulty = difficulty
    await puzzle.initialize(config)

    // Create initial state
    const gameState: PuzzleGameState = {
      puzzleId: puzzle.id,
      playerId,
      status: PuzzleStatus.NOT_STARTED,
      currentState: puzzle.getState(),
      moves: [],
      startTime: new Date(),
      score: 0,
      hintsUsed: 0,
      metadata: {},
    }

    await this.stateManagement.saveState(gameState)
    this.activePuzzles.set(puzzle.id, puzzle)

    // Emit event for replay-service
    this.replayClient.emit('PUZZLE_STARTED', {
      puzzleId: puzzle.id,
      playerId,
      initialState: gameState.currentState,
    });

    this.logger.log(`Created puzzle ${puzzle.id} for player ${playerId}`)
    return puzzle
  }

  async loadPuzzle(puzzleId: string, playerId: string): Promise<IPuzzle> {
    // Check if puzzle is already active
    let puzzle = this.activePuzzles.get(puzzleId)
    if (puzzle) {
      return puzzle
    }

    // Load from database
    const gameState = await this.stateManagement.loadState(puzzleId, playerId)
    if (!gameState) {
      throw new NotFoundException(`Puzzle ${puzzleId} not found for player ${playerId}`)
    }

    // Recreate puzzle instance
    const factory = this.puzzleRegistry.get(gameState.currentState.type)
    if (!factory) {
      throw new NotFoundException(`Puzzle type ${gameState.currentState.type} not registered`)
    }

    puzzle = factory()
    await puzzle.setState(gameState)
    this.activePuzzles.set(puzzleId, puzzle)

    return puzzle
  }

  async makeMove(puzzleId: string, playerId: string, move: PuzzleMove): Promise<ValidationResult> {
    const puzzle = await this.loadPuzzle(puzzleId, playerId)
    const gameState = await this.stateManagement.loadState(puzzleId, playerId)

    if (!gameState || gameState.status === "completed" || gameState.status === "failed") {
      throw new Error("Cannot make move on completed or failed puzzle")
    }

    // Validate move
    const validationResult = await this.validation.validateMove(puzzle, move)

    // Process cause-effect relationships
    if (validationResult.isValid) {
      const effects = await this.causeEffectEngine.processMove(puzzle, move)
      move.causedEffects = effects
    }

    // Apply move to puzzle
    const moveResult = await puzzle.makeMove(move)

    // Update game state
    gameState.moves.push(move)
    gameState.currentState = puzzle.getState()
    gameState.score = moveResult.score
    gameState.metadata.lastMove = new Date()

    // Check if puzzle is complete
    if (puzzle.isComplete()) {
      gameState.status = PuzzleStatus.COMPLETED
      gameState.endTime = new Date()
      await this.handlePuzzleCompletion(puzzle, gameState)
    }

    await this.stateManagement.saveState(gameState)

    // Track analytics
    await this.analytics.trackMove(puzzleId, playerId, move, moveResult)

    // Emit event for replay-service
    this.replayClient.emit('PUZZLE_MOVE', {
      puzzleId,
      playerId,
      move,
      currentState: puzzle.getState(),
    });

    this.logger.debug(`Move processed for puzzle ${puzzleId}`, {
      playerId,
      moveType: move.moveType,
      isValid: validationResult.isValid,
      isComplete: puzzle.isComplete(),
    })

    return moveResult
  }

  async getPuzzleState(puzzleId: string, playerId: string): Promise<PuzzleGameState> {
    const gameState = await this.stateManagement.loadState(puzzleId, playerId)
    if (!gameState) {
      throw new NotFoundException(`Puzzle ${puzzleId} not found for player ${playerId}`)
    }
    return gameState
  }

  async resetPuzzle(puzzleId: string, playerId: string): Promise<void> {
    const puzzle = await this.loadPuzzle(puzzleId, playerId)
    await puzzle.reset()

    const gameState = await this.stateManagement.loadState(puzzleId, playerId)
    if (gameState) {
      gameState.status = PuzzleStatus.NOT_STARTED
      gameState.currentState = puzzle.getState()
      gameState.moves = []
      gameState.score = 0
      gameState.hintsUsed = 0
      gameState.startTime = new Date()
      gameState.endTime = undefined

      await this.stateManagement.saveState(gameState)
    }

    this.logger.log(`Reset puzzle ${puzzleId} for player ${playerId}`)
  }

  async abandonPuzzle(puzzleId: string, playerId: string): Promise<void> {
    const gameState = await this.stateManagement.loadState(puzzleId, playerId)
    if (gameState) {
      gameState.status = PuzzleStatus.ABANDONED
      gameState.endTime = new Date()
      await this.stateManagement.saveState(gameState)
    }

    // Remove from active puzzles
    this.activePuzzles.delete(puzzleId)

    // Track analytics
    await this.analytics.trackPuzzleAbandoned(puzzleId, playerId)

    this.logger.log(`Abandoned puzzle ${puzzleId} for player ${playerId}`)
  }

  async getActivePuzzles(playerId: string): Promise<PuzzleGameState[]> {
    return this.stateManagement.getActivePuzzles(playerId)
  }

  async clonePuzzle(puzzleId: string, playerId: string, newPlayerId: string): Promise<IPuzzle> {
    const originalPuzzle = await this.loadPuzzle(puzzleId, playerId)
    const clonedPuzzle = originalPuzzle.clone()

    const gameState: PuzzleGameState = {
      puzzleId: clonedPuzzle.id,
      playerId: newPlayerId,
      status: PuzzleStatus.NOT_STARTED,
      currentState: clonedPuzzle.getState(),
      moves: [],
      startTime: new Date(),
      score: 0,
      hintsUsed: 0,
      metadata: {},
    }

    await this.stateManagement.saveState(gameState)
    this.activePuzzles.set(clonedPuzzle.id, clonedPuzzle)

    return clonedPuzzle
  }

  private async handlePuzzleCompletion(puzzle: IPuzzle, gameState: PuzzleGameState): Promise<void> {
    const completionTime = gameState.endTime!.getTime() - gameState.startTime.getTime()

    // Calculate final score with bonuses
    let finalScore = gameState.score

    // Time bonus
    if (puzzle.timeLimit && completionTime < puzzle.timeLimit * 0.5) {
      finalScore *= 1.2 // 20% bonus for fast completion
    }

    // Perfect solution bonus
    if (gameState.hintsUsed === 0 && gameState.moves.length <= (puzzle.maxMoves || Number.POSITIVE_INFINITY)) {
      finalScore *= this.config.progression.perfectSolutionBonus
    }

    gameState.score = Math.round(finalScore)

    // Track completion analytics
    await this.analytics.trackPuzzleCompleted(puzzle.id, gameState.playerId, {
      completionTime,
      finalScore,
      movesUsed: gameState.moves.length,
      hintsUsed: gameState.hintsUsed,
      difficulty: puzzle.difficulty,
    })

    this.logger.log(`Puzzle ${puzzle.id} completed by player ${gameState.playerId}`, {
      score: finalScore,
      time: completionTime,
      moves: gameState.moves.length,
      hints: gameState.hintsUsed,
    })
  }

  async cleanupInactivePuzzles(): Promise<void> {
    const cutoffTime = new Date(Date.now() - this.config.analytics.sessionTimeout)

    for (const [puzzleId, puzzle] of this.activePuzzles) {
      const gameState = puzzle.getState()
      if (gameState.metadata?.lastActivity && new Date(gameState.metadata.lastActivity) < cutoffTime) {
        this.activePuzzles.delete(puzzleId)
        this.logger.debug(`Cleaned up inactive puzzle: ${puzzleId}`)
      }
    }
  }
}
