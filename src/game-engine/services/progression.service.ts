import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import type { ConfigType } from "@nestjs/config"
import type { PlayerMetrics, PerformanceMetrics } from "../interfaces/puzzle.interfaces"
import { PuzzleType, DifficultyLevel } from "../types/puzzle.types"
import { PlayerProgress } from "../entities/player-progress.entity"
import type { gameEngineConfig } from "../config/game-engine.config"

export interface UnlockCriteria {
  puzzleId: string
  requiredPuzzles: string[]
  minimumScore?: number
  minimumSuccessRate?: number
  requiredStreak?: number
  requiredSkillLevel?: Record<PuzzleType, number>
}

export interface Achievement {
  id: string
  name: string
  description: string
  criteria: (metrics: PlayerMetrics) => boolean
  reward: {
    score: number
    unlockedPuzzles?: string[]
    title?: string
  }
}

@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name)
  private readonly unlockCriteria = new Map<string, UnlockCriteria>()
  private readonly achievements = new Map<string, Achievement>();

  constructor(
    @InjectRepository(PlayerProgress)
    private readonly playerProgressRepository: Repository<PlayerProgress>,
    private readonly config: ConfigType<typeof gameEngineConfig>,
  ) {
    this.initializeDefaultAchievements()
  }

  async getPlayerProgress(playerId: string): Promise<PlayerProgress> {
    let progress = await this.playerProgressRepository.findOne({
      where: { playerId },
    })

    if (!progress) {
      progress = this.playerProgressRepository.create({
        playerId,
        totalPuzzlesSolved: 0,
        totalTimeSpent: 0,
        averageCompletionTime: 0,
        successRate: 0,
        currentStreak: 0,
        bestStreak: 0,
        preferredDifficulty: DifficultyLevel.EASY,
        skillLevels: {},
        unlockedPuzzles: [],
        achievements: {},
        statistics: {},
      })

      progress = await this.playerProgressRepository.save(progress)
    }

    return progress
  }

  async updateProgress(playerId: string, performance: PerformanceMetrics): Promise<PlayerProgress> {
    const progress = await this.getPlayerProgress(playerId)

    // Update basic statistics
    progress.totalPuzzlesSolved += performance.completed ? 1 : 0
    progress.totalTimeSpent += performance.timeSpent

    // Recalculate averages
    if (progress.totalPuzzlesSolved > 0) {
      progress.averageCompletionTime = progress.totalTimeSpent / progress.totalPuzzlesSolved
      progress.successRate = this.calculateSuccessRate(playerId, progress)
    }

    // Update streak
    if (performance.completed) {
      progress.currentStreak = Math.max(0, progress.currentStreak) + 1
      progress.bestStreak = Math.max(progress.bestStreak, progress.currentStreak)
    } else {
      progress.currentStreak = Math.min(0, progress.currentStreak) - 1
    }

    // Update skill levels
    const currentSkill = progress.skillLevels[performance.puzzleType] || 1
    const skillAdjustment = this.calculateSkillAdjustment(performance, currentSkill)
    progress.skillLevels[performance.puzzleType] = Math.max(1, currentSkill + skillAdjustment)

    // Check for new unlocks
    const newUnlocks = await this.checkUnlocks(progress)
    progress.unlockedPuzzles.push(...newUnlocks)

    // Check for achievements
    const newAchievements = await this.checkAchievements(progress)
    for (const achievement of newAchievements) {
      progress.achievements[achievement.id] = {
        unlockedAt: new Date(),
        ...achievement.reward,
      }
    }

    // Update statistics
    progress.statistics = {
      ...progress.statistics,
      lastPlayed: new Date(),
      puzzleTypeStats: this.updatePuzzleTypeStats(progress.statistics.puzzleTypeStats || {}, performance),
    }

    const savedProgress = await this.playerProgressRepository.save(progress)

    this.logger.log(`Updated progress for player ${playerId}`, {
      totalSolved: progress.totalPuzzlesSolved,
      currentStreak: progress.currentStreak,
      newUnlocks: newUnlocks.length,
      newAchievements: newAchievements.length,
    })

    return savedProgress
  }

  registerUnlockCriteria(criteria: UnlockCriteria): void {
    this.unlockCriteria.set(criteria.puzzleId, criteria)
    this.logger.log(`Registered unlock criteria for puzzle: ${criteria.puzzleId}`)
  }

  registerAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement)
    this.logger.log(`Registered achievement: ${achievement.name}`)
  }

  async checkUnlocks(progress: PlayerProgress): Promise<string[]> {
    const newUnlocks: string[] = []

    for (const [puzzleId, criteria] of this.unlockCriteria) {
      if (progress.unlockedPuzzles.includes(puzzleId)) {
        continue // Already unlocked
      }

      if (this.meetsUnlockCriteria(progress, criteria)) {
        newUnlocks.push(puzzleId)
      }
    }

    return newUnlocks
  }

  async checkAchievements(progress: PlayerProgress): Promise<Achievement[]> {
    const newAchievements: Achievement[] = []
    const playerMetrics = this.convertToPlayerMetrics(progress)

    for (const [achievementId, achievement] of this.achievements) {
      if (progress.achievements[achievementId]) {
        continue // Already achieved
      }

      if (achievement.criteria(playerMetrics)) {
        newAchievements.push(achievement)
      }
    }

    return newAchievements
  }

  async getRecommendedDifficulty(playerId: string, puzzleType: PuzzleType): Promise<DifficultyLevel> {
    const progress = await this.getPlayerProgress(playerId)
    const skillLevel = progress.skillLevels[puzzleType] || 1

    // Base difficulty on skill level
    let recommendedDifficulty = Math.min(Math.max(Math.round(skillLevel), 1), 8)

    // Adjust based on recent performance
    if (progress.currentStreak > 3) {
      recommendedDifficulty = Math.min(recommendedDifficulty + 1, 8)
    } else if (progress.currentStreak < -2) {
      recommendedDifficulty = Math.max(recommendedDifficulty - 1, 1)
    }

    // Consider success rate
    if (progress.successRate > 0.8) {
      recommendedDifficulty = Math.min(recommendedDifficulty + 1, 8)
    } else if (progress.successRate < 0.4) {
      recommendedDifficulty = Math.max(recommendedDifficulty - 1, 1)
    }

    return recommendedDifficulty as DifficultyLevel
  }

  async getProgressionPath(playerId: string): Promise<string[]> {
    const progress = await this.getPlayerProgress(playerId)
    const availablePuzzles: string[] = []

    // Get all puzzles that can be unlocked next
    for (const [puzzleId, criteria] of this.unlockCriteria) {
      if (!progress.unlockedPuzzles.includes(puzzleId)) {
        const missingRequirements = criteria.requiredPuzzles.filter((req) => !progress.unlockedPuzzles.includes(req))

        if (missingRequirements.length <= 1) {
          // Can unlock with at most 1 more puzzle
          availablePuzzles.push(puzzleId)
        }
      }
    }

    // Sort by difficulty and player skill
    return availablePuzzles.sort((a, b) => {
      const criteriaA = this.unlockCriteria.get(a)!
      const criteriaB = this.unlockCriteria.get(b)!

      // Prefer puzzles that match player's skill level
      const skillDiffA = Math.abs((criteriaA.minimumScore || 0) - progress.totalPuzzlesSolved)
      const skillDiffB = Math.abs((criteriaB.minimumScore || 0) - progress.totalPuzzlesSolved)

      return skillDiffA - skillDiffB
    })
  }

  private meetsUnlockCriteria(progress: PlayerProgress, criteria: UnlockCriteria): boolean {
    // Check required puzzles
    for (const requiredPuzzle of criteria.requiredPuzzles) {
      if (!progress.unlockedPuzzles.includes(requiredPuzzle)) {
        return false
      }
    }

    // Check minimum score
    if (criteria.minimumScore && progress.totalPuzzlesSolved < criteria.minimumScore) {
      return false
    }

    // Check success rate
    if (criteria.minimumSuccessRate && progress.successRate < criteria.minimumSuccessRate) {
      return false
    }

    // Check streak
    if (criteria.requiredStreak && progress.bestStreak < criteria.requiredStreak) {
      return false
    }

    // Check skill levels
    if (criteria.requiredSkillLevel) {
      for (const [puzzleType, requiredLevel] of Object.entries(criteria.requiredSkillLevel)) {
        const currentLevel = progress.skillLevels[puzzleType as PuzzleType] || 1
        if (currentLevel < requiredLevel) {
          return false
        }
      }
    }

    return true
  }

  private calculateSuccessRate(playerId: string, progress: PlayerProgress): number {
    // This would ideally query recent performance data
    // For now, use a simplified calculation
    const totalAttempts = progress.totalPuzzlesSolved + Math.max(0, -progress.currentStreak)
    return totalAttempts > 0 ? progress.totalPuzzlesSolved / totalAttempts : 0
  }

  private calculateSkillAdjustment(performance: PerformanceMetrics, currentSkill: number): number {
    let adjustment = 0

    if (performance.completed) {
      // Successful completion increases skill
      adjustment += 0.1

      // Bonus for efficient completion
      if (performance.hintsUsed === 0) {
        adjustment += 0.05
      }

      // Bonus for fast completion relative to difficulty
      const expectedTime = this.getExpectedTimeForDifficulty(performance.difficulty)
      if (performance.timeSpent < expectedTime * 0.7) {
        adjustment += 0.05
      }
    } else {
      // Failed completion decreases skill slightly
      adjustment -= 0.05

      // Larger decrease if struggled significantly
      if (performance.hintsUsed > 2) {
        adjustment -= 0.05
      }
    }

    // Diminishing returns for high skill levels
    if (currentSkill > 5) {
      adjustment *= 0.5
    }

    return adjustment
  }

  private getExpectedTimeForDifficulty(difficulty: DifficultyLevel): number {
    const baseTimes = {
      1: 60000,
      2: 120000,
      3: 180000,
      4: 300000,
      5: 450000,
      6: 600000,
      7: 900000,
      8: 1200000,
    }

    return baseTimes[difficulty as keyof typeof baseTimes] || 300000
  }

  private updatePuzzleTypeStats(currentStats: any, performance: PerformanceMetrics): any {
    const typeKey = performance.puzzleType
    const typeStats = currentStats[typeKey] || {
      attempted: 0,
      completed: 0,
      totalTime: 0,
      bestScore: 0,
      averageScore: 0,
    }

    typeStats.attempted += 1
    if (performance.completed) {
      typeStats.completed += 1
    }
    typeStats.totalTime += performance.timeSpent
    typeStats.bestScore = Math.max(typeStats.bestScore, performance.score)
    typeStats.averageScore =
      (typeStats.averageScore * (typeStats.attempted - 1) + performance.score) / typeStats.attempted

    return {
      ...currentStats,
      [typeKey]: typeStats,
    }
  }

  private convertToPlayerMetrics(progress: PlayerProgress): PlayerMetrics {
    return {
      playerId: progress.playerId,
      totalPuzzlesSolved: progress.totalPuzzlesSolved,
      averageCompletionTime: progress.averageCompletionTime,
      successRate: progress.successRate,
      currentStreak: progress.currentStreak,
      bestStreak: progress.bestStreak,
      preferredDifficulty: progress.preferredDifficulty,
      skillLevels: progress.skillLevels,
      recentPerformance: [], // Would be populated from separate query
    }
  }

  private initializeDefaultAchievements(): void {
    // First Steps
    this.registerAchievement({
      id: "first-puzzle",
      name: "First Steps",
      description: "Complete your first puzzle",
      criteria: (metrics) => metrics.totalPuzzlesSolved >= 1,
      reward: { score: 100, title: "Puzzle Solver" },
    })

    // Streak achievements
    this.registerAchievement({
      id: "streak-5",
      name: "On a Roll",
      description: "Complete 5 puzzles in a row",
      criteria: (metrics) => metrics.currentStreak >= 5,
      reward: { score: 250 },
    })

    this.registerAchievement({
      id: "streak-10",
      name: "Unstoppable",
      description: "Complete 10 puzzles in a row",
      criteria: (metrics) => metrics.currentStreak >= 10,
      reward: { score: 500, title: "Puzzle Master" },
    })

    // Speed achievements
    this.registerAchievement({
      id: "speed-demon",
      name: "Speed Demon",
      description: "Complete a puzzle in under 30 seconds",
      criteria: (metrics) => metrics.averageCompletionTime < 30000,
      reward: { score: 300 },
    })

    // Perfectionist
    this.registerAchievement({
      id: "perfectionist",
      name: "Perfectionist",
      description: "Complete 10 puzzles without using any hints",
      criteria: (metrics) => {
        // This would need to track hint usage across puzzles
        return metrics.totalPuzzlesSolved >= 10 // Simplified
      },
      reward: { score: 400, title: "Perfectionist" },
    })

    // Skill-based achievements
    Object.values(PuzzleType).forEach((puzzleType) => {
      this.registerAchievement({
        id: `expert-${puzzleType}`,
        name: `${puzzleType} Expert`,
        description: `Reach expert level in ${puzzleType} puzzles`,
        criteria: (metrics) => (metrics.skillLevels[puzzleType] || 0) >= 7,
        reward: { score: 600, title: `${puzzleType} Expert` },
      })
    })

    // Volume achievements
    this.registerAchievement({
      id: "century",
      name: "Century Club",
      description: "Complete 100 puzzles",
      criteria: (metrics) => metrics.totalPuzzlesSolved >= 100,
      reward: { score: 1000, title: "Century Solver" },
    })

    this.logger.log("Initialized default achievements")
  }
}
