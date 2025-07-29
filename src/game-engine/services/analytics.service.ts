import { Injectable, Logger } from "@nestjs/common"
import type { Repository } from "typeorm"
import type { ConfigType } from "@nestjs/config"
import type { PuzzleAnalytics } from "../entities/puzzle-analytics.entity"
import type { GameSession } from "../entities/game-session.entity"
import { PuzzleType, DifficultyLevel } from "../types/puzzle.types"
import type { gameEngineConfig } from "../config/game-engine.config"

export interface AnalyticsEvent {
  type: string
  puzzleId: string
  playerId: string
  sessionId: string
  data: any
  timestamp: Date
}

export interface PlayerAnalytics {
  playerId: string
  totalPlayTime: number
  puzzlesSolved: number
  averageCompletionTime: number
  preferredDifficulty: DifficultyLevel
  strongestPuzzleType: PuzzleType
  weakestPuzzleType: PuzzleType
  improvementAreas: string[]
  achievements: number
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name)
  private readonly eventQueue: AnalyticsEvent[] = []
  private readonly sessionCache = new Map<string, GameSession>()

  constructor(
    private readonly analyticsRepository: Repository<PuzzleAnalytics>,
    private readonly sessionRepository: Repository<GameSession>,
    private readonly config: ConfigType<typeof gameEngineConfig>,
  ) {
    // Process queued events periodically
    setInterval(() => this.processEventQueue(), 5000)
  }

  async trackMove(puzzleId: string, playerId: string, move: any, result: any): Promise<void> {
    if (!this.config.analytics.trackingEnabled) return

    try {
      const session = await this.getOrCreateSession(playerId)

      const analyticsData = {
        puzzleId,
        playerId,
        sessionId: session.sessionId,
        puzzleType: move.moveData?.puzzleType || PuzzleType.CUSTOM,
        difficulty: move.moveData?.difficulty || DifficultyLevel.MEDIUM,
        eventType: "move",
        eventData: {
          moveType: move.moveType,
          moveData: move.moveData,
          isValid: move.isValid,
          score: result.score,
          completionPercentage: result.completionPercentage,
          causedEffects: move.causedEffects?.length || 0,
        },
        timeSpent: 0, // Will be calculated based on move timestamps
        moveCount: 1,
        hintsUsed: 0,
        score: result.score,
        completed: result.isComplete,
        metadata: {
          validationErrors: result.errors,
          timeBonus: result.timeBonus,
          perfectSolution: result.perfectSolution,
        },
        timestamp: move.timestamp,
      }

      await this.analyticsRepository.save(analyticsData)

      this.logger.debug(`Tracked move for puzzle ${puzzleId}`, {
        playerId,
        moveType: move.moveType,
        isValid: move.isValid,
        score: result.score,
      })
    } catch (error) {
      this.logger.error(`Error tracking move for puzzle ${puzzleId}:`, error)
    }
  }

  async trackPuzzleCompleted(
    puzzleId: string,
    playerId: string,
    completionData: {
      completionTime: number
      finalScore: number
      movesUsed: number
      hintsUsed: number
      difficulty: DifficultyLevel
    },
  ): Promise<void> {
    if (!this.config.analytics.trackingEnabled) return

    try {
      const session = await this.getOrCreateSession(playerId)

      const analyticsData = {
        puzzleId,
        playerId,
        sessionId: session.sessionId,
        puzzleType: PuzzleType.CUSTOM, // Would be determined from puzzle data
        difficulty: completionData.difficulty,
        eventType: "puzzle_completed",
        eventData: completionData,
        timeSpent: completionData.completionTime,
        moveCount: completionData.movesUsed,
        hintsUsed: completionData.hintsUsed,
        score: completionData.finalScore,
        completed: true,
        metadata: {
          efficiency: this.calculateEfficiency(completionData),
          performance: this.calculatePerformance(completionData),
        },
        timestamp: new Date(),
      }

      await this.analyticsRepository.save(analyticsData)

      // Update session statistics
      session.puzzlesCompleted += 1
      session.totalScore += completionData.finalScore
      session.totalHintsUsed += completionData.hintsUsed
      await this.sessionRepository.save(session)

      this.logger.log(`Tracked puzzle completion: ${puzzleId}`, {
        playerId,
        score: completionData.finalScore,
        time: completionData.completionTime,
        moves: completionData.movesUsed,
      })
    } catch (error) {
      this.logger.error(`Error tracking puzzle completion for ${puzzleId}:`, error)
    }
  }

  async trackPuzzleAbandoned(puzzleId: string, playerId: string): Promise<void> {
    if (!this.config.analytics.trackingEnabled) return

    try {
      const session = await this.getOrCreateSession(playerId)

      const analyticsData = {
        puzzleId,
        playerId,
        sessionId: session.sessionId,
        puzzleType: PuzzleType.CUSTOM,
        difficulty: DifficultyLevel.MEDIUM,
        eventType: "puzzle_abandoned",
        eventData: { reason: "user_abandoned" },
        timeSpent: 0,
        moveCount: 0,
        hintsUsed: 0,
        score: 0,
        completed: false,
        metadata: {},
        timestamp: new Date(),
      }

      await this.analyticsRepository.save(analyticsData)

      this.logger.debug(`Tracked puzzle abandonment: ${puzzleId}`, { playerId })
    } catch (error) {
      this.logger.error(`Error tracking puzzle abandonment for ${puzzleId}:`, error)
    }
  }

  async getPlayerAnalytics(playerId: string): Promise<PlayerAnalytics> {
    try {
      const analytics = await this.analyticsRepository
        .createQueryBuilder("analytics")
        .select([
          "SUM(analytics.timeSpent) as totalPlayTime",
          "COUNT(CASE WHEN analytics.completed = true THEN 1 END) as puzzlesSolved",
          "AVG(CASE WHEN analytics.completed = true THEN analytics.timeSpent END) as averageCompletionTime",
          "analytics.puzzleType",
          "analytics.difficulty",
          "AVG(analytics.score) as averageScore",
          "COUNT(*) as attempts",
        ])
        .where("analytics.playerId = :playerId", { playerId })
        .groupBy("analytics.puzzleType, analytics.difficulty")
        .getRawMany()

      if (analytics.length === 0) {
        return this.getDefaultPlayerAnalytics(playerId)
      }

      // Calculate aggregated metrics
      const totalPlayTime = analytics.reduce((sum, row) => sum + Number.parseInt(row.totalPlayTime || "0"), 0)
      const puzzlesSolved = analytics.reduce((sum, row) => sum + Number.parseInt(row.puzzlesSolved || "0"), 0)
      const averageCompletionTime =
        analytics.reduce((sum, row) => sum + Number.parseFloat(row.averageCompletionTime || "0"), 0) / analytics.length

      // Find strongest and weakest puzzle types
      const typePerformance = this.calculateTypePerformance(analytics)
      const strongestType = typePerformance.reduce((best, current) =>
        current.performance > best.performance ? current : best,
      )
      const weakestType = typePerformance.reduce((worst, current) =>
        current.performance < worst.performance ? current : worst,
      )

      // Calculate preferred difficulty
      const difficultyStats = this.calculateDifficultyPreference(analytics)
      const preferredDifficulty = difficultyStats.mostPlayed

      return {
        playerId,
        totalPlayTime,
        puzzlesSolved,
        averageCompletionTime,
        preferredDifficulty,
        strongestPuzzleType: strongestType.type,
        weakestPuzzleType: weakestType.type,
        improvementAreas: this.identifyImprovementAreas(analytics),
        achievements: 0, // Would be calculated from achievements data
      }
    } catch (error) {
      this.logger.error(`Error getting player analytics for ${playerId}:`, error)
      return this.getDefaultPlayerAnalytics(playerId)
    }
  }

  async getPuzzleAnalytics(puzzleId: string): Promise<any> {
    try {
      const analytics = await this.analyticsRepository
        .createQueryBuilder("analytics")
        .select([
          "COUNT(*) as totalAttempts",
          "COUNT(CASE WHEN analytics.completed = true THEN 1 END) as completions",
          "AVG(analytics.timeSpent) as averageTime",
          "AVG(analytics.moveCount) as averageMoves",
          "AVG(analytics.hintsUsed) as averageHints",
          "AVG(analytics.score) as averageScore",
          "MIN(analytics.timeSpent) as bestTime",
          "MAX(analytics.score) as bestScore",
        ])
        .where("analytics.puzzleId = :puzzleId", { puzzleId })
        .getRawOne()

      const completionRate = analytics.totalAttempts > 0 ? (analytics.completions / analytics.totalAttempts) * 100 : 0

      return {
        puzzleId,
        totalAttempts: Number.parseInt(analytics.totalAttempts || "0"),
        completions: Number.parseInt(analytics.completions || "0"),
        completionRate,
        averageTime: Number.parseFloat(analytics.averageTime || "0"),
        averageMoves: Number.parseFloat(analytics.averageMoves || "0"),
        averageHints: Number.parseFloat(analytics.averageHints || "0"),
        averageScore: Number.parseFloat(analytics.averageScore || "0"),
        bestTime: Number.parseInt(analytics.bestTime || "0"),
        bestScore: Number.parseInt(analytics.bestScore || "0"),
      }
    } catch (error) {
      this.logger.error(`Error getting puzzle analytics for ${puzzleId}:`, error)
      return null
    }
  }

  async getSystemAnalytics(): Promise<any> {
    try {
      const [playerStats, puzzleStats, sessionStats] = await Promise.all([
        this.getPlayerStats(),
        this.getPuzzleStats(),
        this.getSessionStats(),
      ])

      return {
        players: playerStats,
        puzzles: puzzleStats,
        sessions: sessionStats,
        timestamp: new Date(),
      }
    } catch (error) {
      this.logger.error("Error getting system analytics:", error)
      return null
    }
  }

  private async getOrCreateSession(playerId: string): Promise<GameSession> {
    const sessionId = `session-${playerId}-${Date.now()}`

    let session = this.sessionCache.get(playerId)
    if (session && session.isActive) {
      return session
    }

    // Check for active session in database
    const foundSession = await this.sessionRepository.findOne({
      where: { userId: playerId, isActive: true },
      order: { startTime: "DESC" },
    })
    
    if (foundSession) {
      session = foundSession
      
      // Check if session is still valid
      const sessionAge = Date.now() - session.startTime.getTime()
      if (sessionAge < this.config.analytics.sessionTimeout) {
        this.sessionCache.set(playerId, session)
        return session
      } else {
        // Close expired session
        session.isActive = false
        session.endTime = new Date()
        await this.sessionRepository.save(session)
      }
    }

    // Create new session
    session = this.sessionRepository.create({
      sessionId,
      userId: playerId,
      startTime: new Date(),
      puzzlesAttempted: 0,
      puzzlesCompleted: 0,
      totalScore: 0,
      totalHintsUsed: 0,
      puzzleIds: [],
      isActive: true,
    })

    session = await this.sessionRepository.save(session)
    this.sessionCache.set(playerId, session)

    return session
  }

  private calculateEfficiency(completionData: any): number {
    // Calculate efficiency based on time and moves
    const timeEfficiency = Math.max(0, 1 - completionData.completionTime / 600000) // 10 minutes max
    const moveEfficiency = Math.max(0, 1 - completionData.movesUsed / 50) // 50 moves max
    const hintPenalty = completionData.hintsUsed * 0.1

    return Math.max(0, (timeEfficiency + moveEfficiency) / 2 - hintPenalty)
  }

  private calculatePerformance(completionData: any): string {
    const efficiency = this.calculateEfficiency(completionData)

    if (efficiency > 0.8) return "excellent"
    if (efficiency > 0.6) return "good"
    if (efficiency > 0.4) return "average"
    if (efficiency > 0.2) return "below_average"
    return "poor"
  }

  private calculateTypePerformance(analytics: any[]): any[] {
    const typeMap = new Map<PuzzleType, { attempts: number; completions: number; avgScore: number }>()

    for (const row of analytics) {
      const type = row.puzzleType as PuzzleType
      const existing = typeMap.get(type) || { attempts: 0, completions: 0, avgScore: 0 }

      existing.attempts += Number.parseInt(row.attempts || "0")
      existing.completions += Number.parseInt(row.puzzlesSolved || "0")
      existing.avgScore = (existing.avgScore + Number.parseFloat(row.averageScore || "0")) / 2

      typeMap.set(type, existing)
    }

    return Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      performance: stats.attempts > 0 ? (stats.completions / stats.attempts) * stats.avgScore : 0,
    }))
  }

  private calculateDifficultyPreference(analytics: any[]): any {
    const difficultyMap = new Map<DifficultyLevel, number>()

    for (const row of analytics) {
      const difficulty = row.difficulty as DifficultyLevel
      const attempts = Number.parseInt(row.attempts || "0")
      difficultyMap.set(difficulty, (difficultyMap.get(difficulty) || 0) + attempts)
    }

    const mostPlayed = Array.from(difficultyMap.entries()).reduce((max, current) =>
      current[1] > max[1] ? current : max,
    )[0]

    return { mostPlayed }
  }

  private identifyImprovementAreas(analytics: any[]): string[] {
    const areas: string[] = []

    // Analyze completion rates by type
    for (const row of analytics) {
      const completionRate = Number.parseInt(row.puzzlesSolved || "0") / Number.parseInt(row.attempts || "1")
      if (completionRate < 0.5) {
        areas.push(`${row.puzzleType}_completion`)
      }

      const avgTime = Number.parseFloat(row.averageCompletionTime || "0")
      if (avgTime > 600000) {
        // 10 minutes
        areas.push(`${row.puzzleType}_speed`)
      }
    }

    return areas
  }

  private getDefaultPlayerAnalytics(playerId: string): PlayerAnalytics {
    return {
      playerId,
      totalPlayTime: 0,
      puzzlesSolved: 0,
      averageCompletionTime: 0,
      preferredDifficulty: DifficultyLevel.EASY,
      strongestPuzzleType: PuzzleType.CUSTOM,
      weakestPuzzleType: PuzzleType.CUSTOM,
      improvementAreas: [],
      achievements: 0,
    }
  }

  private async getPlayerStats(): Promise<any> {
    const stats = await this.analyticsRepository
      .createQueryBuilder("analytics")
      .select([
        "COUNT(DISTINCT analytics.playerId) as totalPlayers",
        "COUNT(CASE WHEN analytics.completed = true THEN 1 END) as totalCompletions",
        "AVG(analytics.timeSpent) as averagePlayTime",
      ])
      .getRawOne()

    return {
      totalPlayers: Number.parseInt(stats.totalPlayers || "0"),
      totalCompletions: Number.parseInt(stats.totalCompletions || "0"),
      averagePlayTime: Number.parseFloat(stats.averagePlayTime || "0"),
    }
  }

  private async getPuzzleStats(): Promise<any> {
    const stats = await this.analyticsRepository
      .createQueryBuilder("analytics")
      .select([
        "COUNT(DISTINCT analytics.puzzleId) as totalPuzzles",
        "analytics.puzzleType",
        "COUNT(*) as attempts",
        "COUNT(CASE WHEN analytics.completed = true THEN 1 END) as completions",
      ])
      .groupBy("analytics.puzzleType")
      .getRawMany()

    return stats.map((row) => ({
      puzzleType: row.puzzleType,
      attempts: Number.parseInt(row.attempts || "0"),
      completions: Number.parseInt(row.completions || "0"),
      completionRate:
        Number.parseInt(row.attempts || "0") > 0
          ? (Number.parseInt(row.completions || "0") / Number.parseInt(row.attempts || "0")) * 100
          : 0,
    }))
  }

  private async getSessionStats(): Promise<any> {
    const stats = await this.sessionRepository
      .createQueryBuilder("session")
      .select([
        "COUNT(*) as totalSessions",
        "AVG(session.puzzlesCompleted) as averagePuzzlesPerSession",
        "AVG(EXTRACT(EPOCH FROM (session.endTime - session.startTime))) as averageSessionDuration",
      ])
      .where("session.endTime IS NOT NULL")
      .getRawOne()

    return {
      totalSessions: Number.parseInt(stats.totalSessions || "0"),
      averagePuzzlesPerSession: Number.parseFloat(stats.averagePuzzlesPerSession || "0"),
      averageSessionDuration: Number.parseFloat(stats.averageSessionDuration || "0") * 1000, // Convert to milliseconds
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = this.eventQueue.splice(0, 100) // Process up to 100 events at a time

    try {
      for (const event of events) {
        await this.processAnalyticsEvent(event)
      }
    } catch (error) {
      this.logger.error("Error processing analytics event queue:", error)
    }
  }

  private async processAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    // Process individual analytics events
    // This could include real-time calculations, alerts, etc.
    this.logger.debug(`Processed analytics event: ${event.type}`)
  }
}
