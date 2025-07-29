import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { PuzzleGameState } from "../interfaces/puzzle.interfaces"
import type { PuzzleStatus } from "../types/puzzle.types"
import type { PuzzleState } from "../entities/puzzle-state.entity"

@Injectable()
export class StateManagementService {
  private readonly logger = new Logger(StateManagementService.name)
  private readonly stateCache = new Map<string, PuzzleGameState>()

  constructor(puzzleStateRepository: Repository<PuzzleState>) {
    this.puzzleStateRepository = puzzleStateRepository
  }

  private puzzleStateRepository: Repository<PuzzleState>

  async saveState(gameState: PuzzleGameState): Promise<void> {
    const cacheKey = `${gameState.puzzleId}:${gameState.playerId}`

    try {
      // Update cache
      this.stateCache.set(cacheKey, { ...gameState })

      // Save to database
      const existingState = await this.puzzleStateRepository.findOne({
        where: {
          puzzleId: gameState.puzzleId,
          playerId: gameState.playerId,
        },
      })

      const stateData = {
        playerId: gameState.playerId,
        puzzleId: gameState.puzzleId,
        puzzleType: gameState.currentState.type,
        status: gameState.status,
        difficulty: gameState.currentState.difficulty,
        currentState: gameState.currentState,
        moves: gameState.moves.map(move => ({
          id: move.id,
          timestamp: move.timestamp,
          playerId: move.playerId,
          puzzleId: move.puzzleId,
          moveType: move.moveType,
          moveData: move.moveData,
          isValid: move.isValid,
          causedEffects: move.causedEffects,
        })),
        startTime: gameState.startTime,
        endTime: gameState.endTime,
        score: gameState.score,
        hintsUsed: gameState.hintsUsed,
        timeSpent: gameState.endTime
          ? gameState.endTime.getTime() - gameState.startTime.getTime()
          : Date.now() - gameState.startTime.getTime(),
        metadata: gameState.metadata,
      }

      if (existingState) {
        await this.puzzleStateRepository.update(existingState.id, stateData as any)
      } else {
        await this.puzzleStateRepository.save(stateData)
      }

      this.logger.debug(`Saved state for puzzle ${gameState.puzzleId}`)
    } catch (error) {
      this.logger.error(`Failed to save state for puzzle ${gameState.puzzleId}:`, error)
      throw error
    }
  }

  async loadState(puzzleId: string, playerId: string): Promise<PuzzleGameState | null> {
    const cacheKey = `${puzzleId}:${playerId}`

    try {
      // Check cache first
      const cachedState = this.stateCache.get(cacheKey)
      if (cachedState) {
        return cachedState
      }

      // Load from database
      const stateEntity = await this.puzzleStateRepository.findOne({
        where: {
          puzzleId,
          playerId,
        },
      })

      if (!stateEntity) {
        return null
      }

      const gameState: PuzzleGameState = {
        puzzleId: stateEntity.puzzleId,
        playerId: stateEntity.playerId,
        status: stateEntity.status,
        currentState: stateEntity.currentState,
        moves: stateEntity.moves || [],
        startTime: stateEntity.startTime,
        endTime: stateEntity.endTime,
        score: stateEntity.score,
        hintsUsed: stateEntity.hintsUsed,
        metadata: stateEntity.metadata || {},
      }

      // Cache the loaded state
      this.stateCache.set(cacheKey, gameState)

      return gameState
    } catch (error) {
      this.logger.error(`Failed to load state for puzzle ${puzzleId}:`, error)
      throw error
    }
  }

  async deleteState(puzzleId: string, playerId: string): Promise<void> {
    const cacheKey = `${puzzleId}:${playerId}`

    try {
      // Remove from cache
      this.stateCache.delete(cacheKey)

      // Delete from database
      await this.puzzleStateRepository.delete({
        puzzleId,
        playerId,
      })

      this.logger.debug(`Deleted state for puzzle ${puzzleId}`)
    } catch (error) {
      this.logger.error(`Failed to delete state for puzzle ${puzzleId}:`, error)
      throw error
    }
  }

  async getActivePuzzles(playerId: string): Promise<PuzzleGameState[]> {
    try {
      const activeStates = await this.puzzleStateRepository.find({
        where: {
          playerId,
          status: "in_progress" as PuzzleStatus,
        },
        order: {
          updatedAt: "DESC",
        },
      })

      return activeStates.map((state) => ({
        puzzleId: state.puzzleId,
        playerId: state.playerId,
        status: state.status,
        currentState: state.currentState,
        moves: state.moves || [],
        startTime: state.startTime,
        endTime: state.endTime,
        score: state.score,
        hintsUsed: state.hintsUsed,
        metadata: state.metadata || {},
      }))
    } catch (error) {
      this.logger.error(`Failed to get active puzzles for player ${playerId}:`, error)
      throw error
    }
  }

  async getPlayerStats(playerId: string): Promise<any> {
    try {
      const stats = await this.puzzleStateRepository
        .createQueryBuilder("state")
        .select([
          "COUNT(*) as total_puzzles",
          "COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_puzzles",
          "AVG(CASE WHEN status = 'completed' THEN score END) as average_score",
          "AVG(CASE WHEN status = 'completed' THEN time_spent END) as average_time",
          "MAX(score) as best_score",
          "MIN(CASE WHEN status = 'completed' THEN time_spent END) as best_time",
        ])
        .where("state.playerId = :playerId", { playerId })
        .getRawOne()

      return {
        totalPuzzles: Number.parseInt(stats.total_puzzles) || 0,
        completedPuzzles: Number.parseInt(stats.completed_puzzles) || 0,
        averageScore: Number.parseFloat(stats.average_score) || 0,
        averageTime: Number.parseFloat(stats.average_time) || 0,
        bestScore: Number.parseInt(stats.best_score) || 0,
        bestTime: Number.parseInt(stats.best_time) || 0,
        completionRate:
          Number.parseInt(stats.total_puzzles) > 0
            ? (Number.parseInt(stats.completed_puzzles) / Number.parseInt(stats.total_puzzles)) * 100
            : 0,
      }
    } catch (error) {
      this.logger.error(`Failed to get player stats for ${playerId}:`, error)
      throw error
    }
  }

  async cleanupOldStates(retentionDays: number): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const result = await this.puzzleStateRepository
        .createQueryBuilder()
        .delete()
        .where("updatedAt < :cutoffDate", { cutoffDate })
        .andWhere("status IN (:...statuses)", { statuses: ["completed", "failed", "abandoned"] })
        .execute()

      this.logger.log(`Cleaned up ${result.affected} old puzzle states`)
    } catch (error) {
      this.logger.error("Failed to cleanup old states:", error)
      throw error
    }
  }

  clearCache(): void {
    this.stateCache.clear()
    this.logger.debug("Cleared state cache")
  }
}
