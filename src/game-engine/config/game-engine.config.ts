import { registerAs } from "@nestjs/config"

export interface GameEngineConfig {
  puzzles: {
    maxConcurrentPuzzles: number
    defaultTimeLimit: number
    autoSaveInterval: number
    maxHintsPerPuzzle: number
  }
  difficulty: {
    adaptiveScaling: boolean
    performanceWindow: number
    difficultyRange: {
      min: number
      max: number
    }
    scalingFactors: {
      success: number
      failure: number
      time: number
    }
  }
  progression: {
    unlockThreshold: number
    streakBonus: number
    perfectSolutionBonus: number
  }
  analytics: {
    trackingEnabled: boolean
    sessionTimeout: number
    metricsRetention: number
  }
  hints: {
    cooldownPeriod: number
    maxHintsPerSession: number
    hintPenalty: number
  }
  validation: {
    strictMode: boolean
    allowPartialSolutions: boolean
    timeoutThreshold: number
  }
}

export const gameEngineConfig = registerAs(
  "gameEngine",
  (): GameEngineConfig => ({
    puzzles: {
      maxConcurrentPuzzles: Number.parseInt(process.env.GAME_MAX_CONCURRENT_PUZZLES || "5"),
      defaultTimeLimit: Number.parseInt(process.env.GAME_DEFAULT_TIME_LIMIT || "300000"),
      autoSaveInterval: Number.parseInt(process.env.GAME_AUTO_SAVE_INTERVAL || "30000"),
      maxHintsPerPuzzle: Number.parseInt(process.env.GAME_MAX_HINTS_PER_PUZZLE || "3"),
    },
    difficulty: {
      adaptiveScaling: process.env.GAME_ADAPTIVE_SCALING !== "false",
      performanceWindow: Number.parseInt(process.env.GAME_PERFORMANCE_WINDOW || "10"),
      difficultyRange: {
        min: Number.parseInt(process.env.GAME_DIFFICULTY_MIN || "1"),
        max: Number.parseInt(process.env.GAME_DIFFICULTY_MAX || "10"),
      },
      scalingFactors: {
        success: Number.parseFloat(process.env.GAME_SUCCESS_FACTOR || "1.1"),
        failure: Number.parseFloat(process.env.GAME_FAILURE_FACTOR || "0.9"),
        time: Number.parseFloat(process.env.GAME_TIME_FACTOR || "1.05"),
      },
    },
    progression: {
      unlockThreshold: Number.parseFloat(process.env.GAME_UNLOCK_THRESHOLD || "0.7"),
      streakBonus: Number.parseFloat(process.env.GAME_STREAK_BONUS || "1.2"),
      perfectSolutionBonus: Number.parseFloat(process.env.GAME_PERFECT_BONUS || "1.5"),
    },
    analytics: {
      trackingEnabled: process.env.GAME_ANALYTICS_ENABLED !== "false",
      sessionTimeout: Number.parseInt(process.env.GAME_SESSION_TIMEOUT || "1800000"),
      metricsRetention: Number.parseInt(process.env.GAME_METRICS_RETENTION || "90"),
    },
    hints: {
      cooldownPeriod: Number.parseInt(process.env.GAME_HINT_COOLDOWN || "60000"),
      maxHintsPerSession: Number.parseInt(process.env.GAME_MAX_HINTS_SESSION || "10"),
      hintPenalty: Number.parseFloat(process.env.GAME_HINT_PENALTY || "0.1"),
    },
    validation: {
      strictMode: process.env.GAME_STRICT_MODE === "true",
      allowPartialSolutions: process.env.GAME_ALLOW_PARTIAL !== "false",
      timeoutThreshold: Number.parseInt(process.env.GAME_TIMEOUT_THRESHOLD || "600000"),
    },
  }),
)
