import { Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type {
  IPuzzle,
  PerformanceMetrics,
} from '../interfaces/puzzle.interfaces';
import { PuzzleType, DifficultyLevel } from '../types/puzzle.types';
import type { gameEngineConfig } from '../config/game-engine.config';

interface ScoreCalculationResult {
  baseScore: number;
  timeBonus: number;
  efficiencyBonus: number;
  difficultyMultiplier: number;
  streakBonus: number;
  hintsUsedPenalty: number;
  finalScore: number;
  breakdown: Record<string, number>;
}

interface RewardCalculation {
  score: number;
  experience: number;
  achievements: string[];
  unlocks: string[];
  bonuses: Record<string, number>;
}

/**
 * Service responsible for calculating scores and managing puzzle rewards
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly config: ConfigType<typeof gameEngineConfig>) {}

  /**
   * Calculate comprehensive score for a completed puzzle
   */
  calculatePuzzleScore(
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStreak: number = 0,
  ): ScoreCalculationResult {
    const baseScore = this.calculateBaseScore(puzzle.difficulty);

    const timeBonus = this.calculateTimeBonus(
      performance.timeSpent,
      puzzle.timeLimit ||
        this.getExpectedTimeLimit(puzzle.type, puzzle.difficulty),
      puzzle.difficulty,
    );

    const efficiencyBonus = this.calculateEfficiencyBonus(
      performance.movesUsed,
      puzzle.maxMoves ||
        this.getExpectedMaxMoves(puzzle.type, puzzle.difficulty),
      puzzle.difficulty,
    );

    const difficultyMultiplier = this.getDifficultyMultiplier(
      puzzle.difficulty,
    );

    const streakBonus = this.calculateStreakBonus(playerStreak, baseScore);

    const hintsUsedPenalty = this.calculateHintsPenalty(
      performance.hintsUsed,
      baseScore,
    );

    // Calculate final score
    let finalScore = baseScore * difficultyMultiplier;
    finalScore += timeBonus + efficiencyBonus + streakBonus;
    finalScore -= hintsUsedPenalty;

    // Apply minimum score threshold
    finalScore = Math.max(finalScore, baseScore * 0.1);

    const result: ScoreCalculationResult = {
      baseScore,
      timeBonus,
      efficiencyBonus,
      difficultyMultiplier,
      streakBonus,
      hintsUsedPenalty,
      finalScore: Math.round(finalScore),
      breakdown: {
        base: baseScore,
        time: timeBonus,
        efficiency: efficiencyBonus,
        difficulty: difficultyMultiplier,
        streak: streakBonus,
        hints: -hintsUsedPenalty,
      },
    };

    this.logger.debug(`Calculated score for puzzle ${puzzle.id}`, {
      finalScore: result.finalScore,
      difficulty: puzzle.difficulty,
      timeSpent: performance.timeSpent,
      movesUsed: performance.movesUsed,
      hintsUsed: performance.hintsUsed,
    });

    return result;
  }

  /**
   * Calculate rewards based on puzzle completion and performance
   */
  calculateRewards(
    puzzle: IPuzzle,
    scoreResult: ScoreCalculationResult,
    performance: PerformanceMetrics,
    playerStats: {
      totalCompleted: number;
      typeCompleted: Record<PuzzleType, number>;
      currentStreak: number;
      bestTime: Record<PuzzleType, number>;
    },
  ): RewardCalculation {
    const rewards: RewardCalculation = {
      score: scoreResult.finalScore,
      experience: this.calculateExperiencePoints(
        scoreResult,
        puzzle.difficulty,
      ),
      achievements: [],
      unlocks: [],
      bonuses: {},
    };

    // Check for achievements
    rewards.achievements = this.checkAchievements(
      puzzle,
      performance,
      playerStats,
    );

    // Check for unlocks
    rewards.unlocks = this.checkUnlocks(puzzle, playerStats);

    // Calculate bonuses
    rewards.bonuses = this.calculateBonuses(
      puzzle,
      scoreResult,
      performance,
      playerStats,
    );

    // Add bonus experience for achievements
    rewards.experience += rewards.achievements.length * 50;

    this.logger.debug(`Calculated rewards for puzzle ${puzzle.id}`, {
      score: rewards.score,
      experience: rewards.experience,
      achievements: rewards.achievements.length,
      unlocks: rewards.unlocks.length,
    });

    return rewards;
  }

  /**
   * Calculate penalty for abandoned puzzle
   */
  calculateAbandonmentPenalty(
    puzzle: IPuzzle,
    timeSpent: number,
    movesUsed: number,
    hintsUsed: number,
  ): number {
    const baseScore = this.calculateBaseScore(puzzle.difficulty);
    const completionPercentage = this.estimateCompletionPercentage(
      timeSpent,
      movesUsed,
      puzzle,
    );

    // Small consolation score based on effort made
    const consolationScore = baseScore * 0.1 * completionPercentage;

    return Math.round(consolationScore);
  }

  private calculateBaseScore(difficulty: DifficultyLevel): number {
    const baseScores = {
      1: 100, // Beginner
      2: 200, // Easy
      3: 350, // Medium
      4: 550, // Hard
      5: 800, // Expert
      6: 1100, // Master
      7: 1500, // Legendary
      8: 2000, // Impossible
    };

    return baseScores[difficulty as keyof typeof baseScores] || 350;
  }

  private calculateTimeBonus(
    actualTime: number,
    expectedTime: number,
    difficulty: DifficultyLevel,
  ): number {
    if (actualTime >= expectedTime) {
      return 0; // No bonus for taking expected time or longer
    }

    const timeRatio = actualTime / expectedTime;
    const bonusRatio = Math.max(0, 1 - timeRatio); // 0 to 1 based on time saved

    // Scale bonus by difficulty
    const maxBonus = 50 * difficulty;
    return Math.round(maxBonus * bonusRatio);
  }

  private calculateEfficiencyBonus(
    actualMoves: number,
    expectedMoves: number,
    difficulty: DifficultyLevel,
  ): number {
    if (actualMoves >= expectedMoves) {
      return 0; // No bonus for using expected moves or more
    }

    const moveRatio = actualMoves / expectedMoves;
    const bonusRatio = Math.max(0, 1 - moveRatio);

    // Scale bonus by difficulty
    const maxBonus = 30 * difficulty;
    return Math.round(maxBonus * bonusRatio);
  }

  private getDifficultyMultiplier(difficulty: DifficultyLevel): number {
    const multipliers = {
      1: 1.0, // Beginner
      2: 1.2, // Easy
      3: 1.5, // Medium
      4: 1.8, // Hard
      5: 2.2, // Expert
      6: 2.7, // Master
      7: 3.3, // Legendary
      8: 4.0, // Impossible
    };

    return multipliers[difficulty as keyof typeof multipliers] || 1.5;
  }

  private calculateStreakBonus(streak: number, baseScore: number): number {
    if (streak <= 1) return 0;

    // Exponential bonus that caps at reasonable level
    const streakMultiplier = Math.min(0.1 * Math.log(streak), 0.5);
    return Math.round(baseScore * streakMultiplier);
  }

  private calculateHintsPenalty(hintsUsed: number, baseScore: number): number {
    if (hintsUsed === 0) return 0;

    // Progressive penalty for using multiple hints
    const penaltyRatio =
      this.config.hints.hintPenalty * hintsUsed * (1 + hintsUsed * 0.1);
    return Math.round(baseScore * penaltyRatio);
  }

  private calculateExperiencePoints(
    scoreResult: ScoreCalculationResult,
    difficulty: DifficultyLevel,
  ): number {
    // Experience is based on score but with different scaling
    const baseExp = scoreResult.finalScore * 0.5;
    const difficultyBonus = difficulty * 10;

    return Math.round(baseExp + difficultyBonus);
  }

  private checkAchievements(
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: any,
  ): string[] {
    const achievements: string[] = [];

    // Perfect completion (no hints, efficient moves, fast time)
    if (
      performance.hintsUsed === 0 &&
      performance.timeSpent < (puzzle.timeLimit || 300000) * 0.5 &&
      performance.movesUsed <= (puzzle.maxMoves || 20) * 0.8
    ) {
      achievements.push('perfect_solver');
    }

    // Speed achievements
    if (performance.timeSpent < (puzzle.timeLimit || 300000) * 0.3) {
      achievements.push('speed_demon');
    }

    // Efficiency achievements
    if (performance.movesUsed <= (puzzle.maxMoves || 20) * 0.5) {
      achievements.push('efficient_solver');
    }

    // No hints achievement
    if (performance.hintsUsed === 0) {
      achievements.push('independent_thinker');
    }

    // Streak achievements
    if (playerStats.currentStreak >= 5) {
      achievements.push('streak_5');
    }
    if (playerStats.currentStreak >= 10) {
      achievements.push('streak_10');
    }

    // Difficulty achievements
    if (puzzle.difficulty >= DifficultyLevel.EXPERT) {
      achievements.push('expert_level');
    }
    if (puzzle.difficulty >= DifficultyLevel.LEGENDARY) {
      achievements.push('legendary_solver');
    }

    // Type-specific milestones
    const typeCompleted = playerStats.typeCompleted[puzzle.type] || 0;
    if (typeCompleted >= 10) {
      achievements.push(`${puzzle.type}_specialist`);
    }
    if (typeCompleted >= 50) {
      achievements.push(`${puzzle.type}_master`);
    }

    return achievements;
  }

  private checkUnlocks(puzzle: IPuzzle, playerStats: any): string[] {
    const unlocks: string[] = [];

    // Unlock harder difficulties
    if (
      puzzle.difficulty >= DifficultyLevel.MEDIUM &&
      playerStats.totalCompleted >= 5
    ) {
      unlocks.push('hard_difficulty');
    }
    if (
      puzzle.difficulty >= DifficultyLevel.HARD &&
      playerStats.totalCompleted >= 15
    ) {
      unlocks.push('expert_difficulty');
    }

    // Unlock new puzzle types
    if (playerStats.totalCompleted >= 3) {
      unlocks.push('sequence_puzzles');
    }
    if (playerStats.totalCompleted >= 8) {
      unlocks.push('spatial_puzzles');
    }
    if (playerStats.totalCompleted >= 15) {
      unlocks.push('pattern_puzzles');
    }

    // Unlock special features
    if (playerStats.currentStreak >= 3) {
      unlocks.push('puzzle_themes');
    }
    if (playerStats.totalCompleted >= 25) {
      unlocks.push('custom_puzzles');
    }

    return unlocks;
  }

  private calculateBonuses(
    puzzle: IPuzzle,
    scoreResult: ScoreCalculationResult,
    performance: PerformanceMetrics,
    playerStats: any,
  ): Record<string, number> {
    const bonuses: Record<string, number> = {};

    // First time bonus for puzzle type
    if ((playerStats.typeCompleted[puzzle.type] || 0) === 1) {
      bonuses.first_time = scoreResult.baseScore * 0.2;
    }

    // Personal best bonus
    const bestTime = playerStats.bestTime[puzzle.type] || Number.MAX_VALUE;
    if (performance.timeSpent < bestTime) {
      bonuses.personal_best = scoreResult.baseScore * 0.15;
    }

    // Weekend bonus (example of time-based bonus)
    const isWeekend = [0, 6].includes(new Date().getDay());
    if (isWeekend) {
      bonuses.weekend = scoreResult.baseScore * 0.1;
    }

    // Comeback bonus (after losing streak)
    if (playerStats.currentStreak === 1 && playerStats.previousStreak < -2) {
      bonuses.comeback = scoreResult.baseScore * 0.25;
    }

    return bonuses;
  }

  private estimateCompletionPercentage(
    timeSpent: number,
    movesUsed: number,
    puzzle: IPuzzle,
  ): number {
    const timeRatio = timeSpent / (puzzle.timeLimit || 300000);
    const moveRatio = movesUsed / (puzzle.maxMoves || 20);

    // Estimate based on effort made
    return Math.min(0.5, (timeRatio + moveRatio) / 2);
  }

  private getExpectedTimeLimit(
    type: PuzzleType,
    difficulty: DifficultyLevel,
  ): number {
    const baseTimes = {
      [PuzzleType.LOGIC_GRID]: 300000, // 5 minutes
      [PuzzleType.SEQUENCE]: 180000, // 3 minutes
      [PuzzleType.SPATIAL]: 420000, // 7 minutes
      [PuzzleType.PATTERN_MATCHING]: 240000, // 4 minutes
      [PuzzleType.MATHEMATICAL]: 300000, // 5 minutes
      [PuzzleType.WORD_PUZZLE]: 360000, // 6 minutes
      [PuzzleType.CUSTOM]: 300000, // 5 minutes
    };

    const baseTime = baseTimes[type] || 300000;
    return baseTime * (0.7 + difficulty * 0.15); // Scale by difficulty
  }

  private getExpectedMaxMoves(
    type: PuzzleType,
    difficulty: DifficultyLevel,
  ): number {
    const baseMoves = {
      [PuzzleType.LOGIC_GRID]: 15,
      [PuzzleType.SEQUENCE]: 8,
      [PuzzleType.SPATIAL]: 25,
      [PuzzleType.PATTERN_MATCHING]: 12,
      [PuzzleType.MATHEMATICAL]: 10,
      [PuzzleType.WORD_PUZZLE]: 18,
      [PuzzleType.CUSTOM]: 15,
    };

    const baseMove = baseMoves[type] || 15;
    return baseMove + (difficulty - 1) * 3; // Scale by difficulty
  }
}
