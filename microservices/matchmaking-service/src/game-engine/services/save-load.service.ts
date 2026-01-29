import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ConfigType } from "@nestjs/config"
import type { PuzzleGameState } from "../interfaces/puzzle.interfaces"
import type { PuzzleState } from "../entities/puzzle-state.entity"
import type { PlayerProgress } from "../entities/player-progress.entity"
import type { GameSession } from "../entities/game-session.entity"
import type { StateManagementService } from "./state-management.service"
import type { gameEngineConfig } from "../config/game-engine.config"

export interface SaveGameData {
  version: string
  timestamp: Date
  playerId: string
  playerProgress: any
  activePuzzles: PuzzleGameState[]
  currentSession: any
  metadata: Record<string, any>
}

export interface LoadGameResult {
  success: boolean
  data?: SaveGameData
  error?: string
  migrationRequired?: boolean
}

@Injectable()
export class SaveLoadService {
  private readonly logger = new Logger(SaveLoadService.name)
  private readonly currentVersion = "1.0.0"

  constructor(
    private readonly puzzleStateRepository: Repository<PuzzleState>,
    private readonly playerProgressRepository: Repository<PlayerProgress>,
    private readonly sessionRepository: Repository<GameSession>,
    private readonly stateManagement: StateManagementService,
    private readonly config: any,
  ) { }

  async saveGame(playerId: string, includeHistory = false): Promise<SaveGameData> {
    try {
      this.logger.log(`Saving game for player ${playerId}`)

      // Get player progress
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      // Get active puzzles
      const activePuzzles = await this.stateManagement.getActivePuzzles(playerId)

      // Get current session
      const currentSession = await this.sessionRepository.findOne({
        where: { playerId, isActive: true },
        order: { startTime: "DESC" },
      })

      // Prepare save data
      const saveData: SaveGameData = {
        version: this.currentVersion,
        timestamp: new Date(),
        playerId,
        playerProgress: playerProgress ? this.serializePlayerProgress(playerProgress) : null,
        activePuzzles: activePuzzles.map((puzzle) => this.serializePuzzleState(puzzle)),
        currentSession: currentSession ? this.serializeSession(currentSession) : null,
        metadata: {
          includeHistory,
          puzzleCount: activePuzzles.length,
          totalPlayTime: playerProgress?.totalTimeSpent || 0,
        },
      }

      // Include historical data if requested
      if (includeHistory) {
        saveData.metadata.historicalPuzzles = await this.getHistoricalPuzzles(playerId)
        saveData.metadata.pastSessions = await this.getPastSessions(playerId)
      }

      this.logger.log(`Game saved successfully for player ${playerId}`, {
        activePuzzles: activePuzzles.length,
        includeHistory,
        dataSize: JSON.stringify(saveData).length,
      })

      return saveData
    } catch (error) {
      this.logger.error(`Error saving game for player ${playerId}:`, error)
      throw error
    }
  }

  async loadGame(playerId: string, saveData?: SaveGameData): Promise<LoadGameResult> {
    try {
      this.logger.log(`Loading game for player ${playerId}`)

      let gameData: SaveGameData

      if (saveData) {
        // Load from provided save data
        gameData = saveData
      } else {
        // Load from database
        const loadResult = await this.loadFromDatabase(playerId)
        if (!loadResult.success) {
          return loadResult
        }
        gameData = loadResult.data!
      }

      // Check version compatibility
      const migrationResult = await this.checkVersionCompatibility(gameData)
      if (migrationResult.migrationRequired) {
        gameData = await this.migrateGameData(gameData)
      }

      // Restore player progress
      if (gameData.playerProgress) {
        await this.restorePlayerProgress(gameData.playerProgress)
      }

      // Restore active puzzles
      for (const puzzleState of gameData.activePuzzles) {
        await this.restorePuzzleState(puzzleState)
      }

      // Restore session
      if (gameData.currentSession) {
        await this.restoreSession(gameData.currentSession)
      }

      this.logger.log(`Game loaded successfully for player ${playerId}`, {
        activePuzzles: gameData.activePuzzles.length,
        version: gameData.version,
        migrationRequired: migrationResult.migrationRequired,
      })

      return {
        success: true,
        data: gameData,
        migrationRequired: migrationResult.migrationRequired,
      }
    } catch (error) {
      this.logger.error(`Error loading game for player ${playerId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async exportGameData(playerId: string, format: "json" | "binary" = "json"): Promise<string | Buffer> {
    try {
      const saveData = await this.saveGame(playerId, true)

      if (format === "json") {
        return JSON.stringify(saveData, null, 2)
      } else {
        // Binary format (compressed JSON)
        const jsonString = JSON.stringify(saveData)
        return Buffer.from(jsonString, "utf-8")
      }
    } catch (error) {
      this.logger.error(`Error exporting game data for player ${playerId}:`, error)
      throw error
    }
  }

  async importGameData(
    playerId: string,
    data: string | Buffer,
    format: "json" | "binary" = "json",
  ): Promise<LoadGameResult> {
    try {
      let saveData: SaveGameData

      if (format === "json") {
        saveData = JSON.parse(data as string)
      } else {
        // Binary format
        const jsonString = (data as any).toString("utf-8")
        saveData = JSON.parse(jsonString)
      }

      // Validate save data structure
      if (!this.validateSaveData(saveData)) {
        return {
          success: false,
          error: "Invalid save data format",
        }
      }

      // Update player ID to current player
      saveData.playerId = playerId

      return await this.loadGame(playerId, saveData)
    } catch (error) {
      this.logger.error(`Error importing game data for player ${playerId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid data format",
      }
    }
  }

  async createCheckpoint(playerId: string, checkpointName: string): Promise<void> {
    try {
      const saveData = await this.saveGame(playerId)

      // Store checkpoint in metadata
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      if (playerProgress) {
        if (!playerProgress.metadata) {
          playerProgress.metadata = {}
        }
        if (!playerProgress.metadata.checkpoints) {
          playerProgress.metadata.checkpoints = {}
        }

        playerProgress.metadata.checkpoints[checkpointName] = {
          data: saveData,
          createdAt: new Date().toISOString(),
        }

        await this.playerProgressRepository.save(playerProgress)
      }

      this.logger.log(`Created checkpoint '${checkpointName}' for player ${playerId}`)
    } catch (error) {
      this.logger.error(`Error creating checkpoint for player ${playerId}:`, error)
      throw error
    }
  }

  async loadCheckpoint(playerId: string, checkpointName: string): Promise<LoadGameResult> {
    try {
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      if (!playerProgress?.metadata?.checkpoints?.[checkpointName]) {
        return {
          success: false,
          error: `Checkpoint '${checkpointName}' not found`,
        }
      }

      const checkpointData = playerProgress.metadata.checkpoints[checkpointName].data
      return await this.loadGame(playerId, checkpointData)
    } catch (error) {
      this.logger.error(`Error loading checkpoint '${checkpointName}' for player ${playerId}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async listCheckpoints(playerId: string): Promise<Array<{ name: string; createdAt: Date }>> {
    try {
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      if (!playerProgress?.metadata?.checkpoints) {
        return []
      }

      return Object.entries(playerProgress.metadata.checkpoints).map(([name, data]: [string, any]) => ({
        name,
        createdAt: new Date(data.createdAt),
      }))
    } catch (error) {
      this.logger.error(`Error listing checkpoints for player ${playerId}:`, error)
      return []
    }
  }

  async deleteCheckpoint(playerId: string, checkpointName: string): Promise<void> {
    try {
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      if (playerProgress?.metadata?.checkpoints?.[checkpointName]) {
        delete playerProgress.metadata.checkpoints[checkpointName]
        await this.playerProgressRepository.save(playerProgress)
        this.logger.log(`Deleted checkpoint '${checkpointName}' for player ${playerId}`)
      }
    } catch (error) {
      this.logger.error(`Error deleting checkpoint '${checkpointName}' for player ${playerId}:`, error)
      throw error
    }
  }

  private async loadFromDatabase(playerId: string): Promise<LoadGameResult> {
    try {
      // Check if player exists
      const playerProgress = await this.playerProgressRepository.findOne({
        where: { playerId },
      })

      if (!playerProgress) {
        return {
          success: false,
          error: "Player not found",
        }
      }

      // Create save data from database
      const saveData = await this.saveGame(playerId)

      return {
        success: true,
        data: saveData,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Database error",
      }
    }
  }

  private async checkVersionCompatibility(saveData: SaveGameData): Promise<{ migrationRequired: boolean }> {
    const saveVersion = saveData.version || "0.0.0"
    const currentVersion = this.currentVersion

    // Simple version comparison (in production, use proper semver)
    const migrationRequired = saveVersion !== currentVersion

    return { migrationRequired }
  }

  private async migrateGameData(saveData: SaveGameData): Promise<SaveGameData> {
    this.logger.log(`Migrating game data from version ${saveData.version} to ${this.currentVersion}`)

    // Perform version-specific migrations
    let migratedData = { ...saveData }

    // Example migration logic
    if (saveData.version === "0.9.0") {
      migratedData = this.migrateFrom090(migratedData)
    }

    migratedData.version = this.currentVersion
    migratedData.metadata.migrated = true
    migratedData.metadata.originalVersion = saveData.version

    return migratedData
  }

  private migrateFrom090(saveData: SaveGameData): SaveGameData {
    // Example migration from version 0.9.0
    const migrated = { ...saveData }

    // Add new fields that didn't exist in 0.9.0
    if (migrated.playerProgress && !migrated.playerProgress.achievements) {
      migrated.playerProgress.achievements = {}
    }

    // Update puzzle state format
    migrated.activePuzzles = migrated.activePuzzles.map((puzzle) => ({
      ...puzzle,
      metadata: puzzle.metadata || {},
    }))

    return migrated
  }

  private validateSaveData(saveData: any): saveData is SaveGameData {
    return (
      saveData &&
      typeof saveData === "object" &&
      typeof saveData.version === "string" &&
      typeof saveData.playerId === "string" &&
      saveData.timestamp &&
      Array.isArray(saveData.activePuzzles)
    )
  }

  private serializePlayerProgress(progress: PlayerProgress): any {
    return {
      id: progress.id,
      playerId: progress.playerId,
      totalPuzzlesSolved: progress.totalPuzzlesSolved,
      totalTimeSpent: progress.totalTimeSpent,
      averageCompletionTime: progress.averageCompletionTime,
      successRate: progress.successRate,
      currentStreak: progress.currentStreak,
      bestStreak: progress.bestStreak,
      preferredDifficulty: progress.preferredDifficulty,
      skillLevels: progress.skillLevels,
      unlockedPuzzles: progress.unlockedPuzzles,
      achievements: progress.achievements,
      statistics: progress.statistics,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
    }
  }

  private serializePuzzleState(state: PuzzleGameState): any {
    return {
      puzzleId: state.puzzleId,
      playerId: state.playerId,
      status: state.status,
      currentState: state.currentState,
      moves: state.moves,
      startTime: state.startTime,
      endTime: state.endTime,
      score: state.score,
      hintsUsed: state.hintsUsed,
      metadata: state.metadata,
    }
  }

  private serializeSession(session: GameSession): any {
    return {
      id: session.id,
      sessionId: session.sessionId,
      playerId: session.playerId,
      startTime: session.startTime,
      endTime: session.endTime,
      puzzlesAttempted: session.puzzlesAttempted,
      puzzlesCompleted: session.puzzlesCompleted,
      totalScore: session.totalScore,
      totalHintsUsed: session.totalHintsUsed,
      puzzleIds: session.puzzleIds,
      sessionData: session.sessionData,
      isActive: session.isActive,
    }
  }

  private async restorePlayerProgress(progressData: any): Promise<void> {
    const existingProgress = await this.playerProgressRepository.findOne({
      where: { playerId: progressData.playerId },
    })

    if (existingProgress) {
      // Update existing progress
      Object.assign(existingProgress, progressData)
      await this.playerProgressRepository.save(existingProgress)
    } else {
      // Create new progress
      const newProgress = this.playerProgressRepository.create(progressData)
      await this.playerProgressRepository.save(newProgress)
    }
  }

  private async restorePuzzleState(stateData: any): Promise<void> {
    await this.stateManagement.saveState(stateData)
  }

  private async restoreSession(sessionData: any): Promise<void> {
    const existingSession = await this.sessionRepository.findOne({
      where: { sessionId: sessionData.sessionId },
    })

    if (existingSession) {
      Object.assign(existingSession, sessionData)
      await this.sessionRepository.save(existingSession)
    } else {
      const newSession = this.sessionRepository.create(sessionData)
      await this.sessionRepository.save(newSession)
    }
  }

  private async getHistoricalPuzzles(playerId: string, limit = 50): Promise<any[]> {
    const historicalPuzzles = await this.puzzleStateRepository.find({
      where: { playerId },
      order: { updatedAt: "DESC" },
      take: limit,
    })

    return historicalPuzzles.map((puzzle) =>
      this.serializePuzzleState({
        puzzleId: puzzle.puzzleId,
        playerId: puzzle.playerId,
        status: puzzle.status,
        currentState: puzzle.currentState,
        moves: puzzle.moves,
        startTime: puzzle.startTime,
        endTime: puzzle.endTime,
        score: puzzle.score,
        hintsUsed: puzzle.hintsUsed,
        metadata: puzzle.metadata,
      }),
    )
  }

  private async getPastSessions(playerId: string, limit = 10): Promise<any[]> {
    const pastSessions = await this.sessionRepository.find({
      where: { playerId, isActive: false },
      order: { startTime: "DESC" },
      take: limit,
    })

    return pastSessions.map((session) => this.serializeSession(session))
  }
}
