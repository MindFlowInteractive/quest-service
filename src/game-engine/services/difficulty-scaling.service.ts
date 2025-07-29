import { Injectable, Logger } from "@nestjs/common"
import type { ConfigType } from "@nestjs/config"
import type { IDifficultyScaler, PlayerMetrics, PerformanceMetrics } from "../interfaces/puzzle.interfaces"
import { PuzzleType } from "../types/puzzle.types"
import type { DifficultyLevel } from "../types/puzzle.types"
import type { gameEngineConfig } from "../config/game-engine.config"

@Injectable()
export class DifficultyScalingService implements IDifficultyScaler {
  private readonly logger = new Logger(DifficultyScalingService.name)

  constructor(private readonly config: ConfigType<typeof gameEngineConfig>) {}

  calculateDifficulty(playerMetrics: PlayerMetrics, puzzleType: PuzzleType): DifficultyLevel {
    try {
      if (!this.config.difficulty.adaptiveScaling) {
        return playerMetrics.preferredDifficulty
      }

      // Get player's skill level for this puzzle type
      const skillLevel = playerMetrics.skillLevels[puzzleType] || 1
      const recentPerformance = this.getRecentPerformance(playerMetrics, puzzleType)

      // Calculate base difficulty from skill level
      let targetDifficulty = Math.min(Math.max(Math.round(skillLevel), 1), 10)

      // Adjust based on recent performance
      if (recentPerformance.length > 0) {
        const avgSuccessRate = this.calculateAverageSuccessRate(recentPerformance)
        const avgCompletionTime = this.calculateAverageCompletionTime(recentPerformance)

        // Increase difficulty if player is performing well
        if (avgSuccessRate > 0.8 && avgCompletionTime < this.getExpectedTime(targetDifficulty)) {
          targetDifficulty = Math.min(targetDifficulty + 1, this.config.difficulty.difficultyRange.max)
        }
        // Decrease difficulty if player is struggling
        else if (avgSuccessRate < 0.4) {
          targetDifficulty = Math.max(targetDifficulty - 1, this.config.difficulty.difficultyRange.min)
        }
      }

      // Consider current streak
      if (playerMetrics.currentStreak > 5) {
        targetDifficulty = Math.min(targetDifficulty + 1, this.config.difficulty.difficultyRange.max)
      } else if (playerMetrics.currentStreak < -3) {
        targetDifficulty = Math.max(targetDifficulty - 1, this.config.difficulty.difficultyRange.min)
      }

      this.logger.debug(`Calculated difficulty ${targetDifficulty} for player`, {
        playerId: playerMetrics.playerId,
        puzzleType,
        skillLevel,
        recentPerformanceCount: recentPerformance.length,
        currentStreak: playerMetrics.currentStreak,
      })

      return Math.max(
        this.config.difficulty.difficultyRange.min,
        Math.min(targetDifficulty, this.config.difficulty.difficultyRange.max),
      ) as DifficultyLevel
    } catch (error) {
      this.logger.error("Error calculating difficulty:", error)
      return playerMetrics.preferredDifficulty
    }
  }

  adjustDifficulty(currentDifficulty: DifficultyLevel, performance: PerformanceMetrics): DifficultyLevel {
    try {
      let adjustment = 0

      // Adjust based on completion
      if (performance.completed) {
        // Fast completion suggests difficulty is too low
        const expectedTime = this.getExpectedTime(currentDifficulty)
        if (performance.timeSpent < expectedTime * 0.5) {
          adjustment += 1
        }
        // Efficient solution (few moves, no hints)
        if (performance.hintsUsed === 0 && performance.movesUsed <= this.getExpectedMoves(currentDifficulty)) {
          adjustment += 0.5
        }
      } else {
        // Failed to complete - reduce difficulty
        adjustment -= 1

        // Significant struggle indicators
        if (performance.hintsUsed > 2) {
          adjustment -= 0.5
        }
        if (performance.timeSpent > this.getExpectedTime(currentDifficulty) * 1.5) {
          adjustment -= 0.5
        }
      }

      const newDifficulty = Math.max(
        this.config.difficulty.difficultyRange.min,
        Math.min(currentDifficulty + adjustment, this.config.difficulty.difficultyRange.max),
      )

      this.logger.debug(`Adjusted difficulty from ${currentDifficulty} to ${newDifficulty}`, {
        completed: performance.completed,
        timeSpent: performance.timeSpent,
        hintsUsed: performance.hintsUsed,
        adjustment,
      })

      return Math.round(newDifficulty) as DifficultyLevel
    } catch (error) {
      this.logger.error("Error adjusting difficulty:", error)
      return currentDifficulty
    }
  }

  getPuzzleParameters(difficulty: DifficultyLevel, puzzleType: PuzzleType): any {
    const baseParams = this.getBasePuzzleParameters(puzzleType)

    // Scale parameters based on difficulty
    const difficultyMultiplier = difficulty / 5 // Normalize to 0.2-2.0 range

    return {
      ...baseParams,
      complexity: Math.round(baseParams.complexity * difficultyMultiplier),
      timeLimit: Math.round(baseParams.timeLimit / difficultyMultiplier),
      maxMoves: Math.round(baseParams.maxMoves * (1 + difficultyMultiplier * 0.5)),
      hintsAvailable: Math.max(1, Math.round(baseParams.hintsAvailable / difficultyMultiplier)),
      constraints: this.scaleConstraints(baseParams.constraints, difficulty),
    }
  }

  private getRecentPerformance(playerMetrics: PlayerMetrics, puzzleType: PuzzleType): PerformanceMetrics[] {
    const windowSize = this.config.difficulty.performanceWindow
    return playerMetrics.recentPerformance.filter((p) => p.puzzleType === puzzleType).slice(-windowSize)
  }

  private calculateAverageSuccessRate(performances: PerformanceMetrics[]): number {
    if (performances.length === 0) return 0.5

    const completedCount = performances.filter((p) => p.completed).length
    return completedCount / performances.length
  }

  private calculateAverageCompletionTime(performances: PerformanceMetrics[]): number {
    const completedPerformances = performances.filter((p) => p.completed)
    if (completedPerformances.length === 0) return 0

    const totalTime = completedPerformances.reduce((sum, p) => sum + p.timeSpent, 0)
    return totalTime / completedPerformances.length
  }

  private getExpectedTime(difficulty: DifficultyLevel): number {
    // Base time expectations in milliseconds
    const baseTimes = {
      1: 60000, // 1 minute
      2: 120000, // 2 minutes
      3: 180000, // 3 minutes
      4: 300000, // 5 minutes
      5: 450000, // 7.5 minutes
      6: 600000, // 10 minutes
      7: 900000, // 15 minutes
      8: 1200000, // 20 minutes
    }

    return baseTimes[difficulty as keyof typeof baseTimes] || 300000
  }

  private getExpectedMoves(difficulty: DifficultyLevel): number {
    // Expected optimal moves for each difficulty
    const baseMoves = {
      1: 5,
      2: 8,
      3: 12,
      4: 18,
      5: 25,
      6: 35,
      7: 50,
      8: 70,
    }

    return baseMoves[difficulty as keyof typeof baseMoves] || 20
  }

  private getBasePuzzleParameters(puzzleType: PuzzleType): any {
    const parameterMap = {
      [PuzzleType.LOGIC_GRID]: {
        complexity: 5,
        timeLimit: 300000,
        maxMoves: 20,
        hintsAvailable: 3,
        constraints: { gridSize: 4, categories: 3 },
      },
      [PuzzleType.SEQUENCE]: {
        complexity: 4,
        timeLimit: 180000,
        maxMoves: 15,
        hintsAvailable: 2,
        constraints: { sequenceLength: 8, patterns: 2 },
      },
      [PuzzleType.PATTERN_MATCHING]: {
        complexity: 3,
        timeLimit: 240000,
        maxMoves: 12,
        hintsAvailable: 3,
        constraints: { patternCount: 6, variations: 3 },
      },
      [PuzzleType.SPATIAL]: {
        complexity: 6,
        timeLimit: 360000,
        maxMoves: 25,
        hintsAvailable: 4,
        constraints: { dimensions: 2, objects: 8 },
      },
      [PuzzleType.MATHEMATICAL]: {
        complexity: 5,
        timeLimit: 300000,
        maxMoves: 18,
        hintsAvailable: 2,
        constraints: { operations: 3, variables: 4 },
      },
      [PuzzleType.WORD_PUZZLE]: {
        complexity: 4,
        timeLimit: 240000,
        maxMoves: 16,
        hintsAvailable: 3,
        constraints: { wordLength: 6, vocabulary: "medium" },
      },
      [PuzzleType.CUSTOM]: {
        complexity: 5,
        timeLimit: 300000,
        maxMoves: 20,
        hintsAvailable: 3,
        constraints: {},
      },
    }

    return parameterMap[puzzleType] || parameterMap[PuzzleType.CUSTOM]
  }

  private scaleConstraints(baseConstraints: any, difficulty: DifficultyLevel): any {
    const scaledConstraints = { ...baseConstraints }

    // Scale numeric constraints
    for (const [key, value] of Object.entries(scaledConstraints)) {
      if (typeof value === "number") {
        const scaleFactor = 0.5 + difficulty / 10 // 0.6 to 1.3 range
        scaledConstraints[key] = Math.round(value * scaleFactor)
      }
    }

    return scaledConstraints
  }
}
