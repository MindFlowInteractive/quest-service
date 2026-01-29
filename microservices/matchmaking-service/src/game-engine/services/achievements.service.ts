import { Injectable, Logger } from '@nestjs/common';
import type {
  IPuzzle,
  PerformanceMetrics,
} from '../interfaces/puzzle.interfaces';
import { PuzzleType, DifficultyLevel } from '../types/puzzle.types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirements: AchievementRequirement[];
  reward: AchievementReward;
  hidden: boolean;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: Date;
}

export enum AchievementCategory {
  COMPLETION = 'completion',
  PERFORMANCE = 'performance',
  STREAK = 'streak',
  EXPLORATION = 'exploration',
  MASTERY = 'mastery',
  SPECIAL = 'special',
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  LEGENDARY = 'legendary',
}

export interface AchievementRequirement {
  type:
    | 'puzzle_count'
    | 'difficulty'
    | 'time'
    | 'efficiency'
    | 'streak'
    | 'score'
    | 'custom';
  value: number;
  puzzleType?: PuzzleType;
  operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  condition?: string;
}

export interface AchievementReward {
  experience: number;
  title?: string;
  badge?: string;
  unlocks?: string[];
  bonuses?: Record<string, number>;
}

export interface PlayerAchievements {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  recentUnlocks: Achievement[];
  nextTargets: Achievement[];
}

/**
 * Service responsible for managing achievements and player progression
 */
@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);
  private readonly achievements: Map<string, Achievement> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  /**
   * Check for newly unlocked achievements after puzzle completion
   */
  checkAchievements(
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: {
      totalCompleted: number;
      typeCompleted: Record<PuzzleType, number>;
      currentStreak: number;
      bestScore: number;
      bestTime: Record<PuzzleType, number>;
      totalScore: number;
      perfectSolves: number;
      hintsUsed: number;
    },
  ): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of this.achievements.values()) {
      if (achievement.unlocked) continue;

      if (
        this.evaluateAchievement(achievement, puzzle, performance, playerStats)
      ) {
        achievement.unlocked = true;
        achievement.unlockedAt = new Date();
        newlyUnlocked.push(achievement);

        this.logger.debug(`Achievement unlocked: ${achievement.id}`, {
          playerId: 'current', // Would come from context
          achievementName: achievement.name,
          tier: achievement.tier,
        });
      } else {
        // Update progress for progressive achievements
        this.updateAchievementProgress(
          achievement,
          puzzle,
          performance,
          playerStats,
        );
      }
    }

    return newlyUnlocked;
  }

  /**
   * Get all achievements with current unlock status
   */
  getPlayerAchievements(playerId: string): PlayerAchievements {
    const allAchievements = Array.from(this.achievements.values());
    const unlockedAchievements = allAchievements.filter((a) => a.unlocked);
    const recentUnlocks = unlockedAchievements
      .filter(
        (a) => a.unlockedAt && Date.now() - a.unlockedAt.getTime() < 86400000,
      ) // Last 24 hours
      .sort(
        (a, b) =>
          (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0),
      )
      .slice(0, 5);

    const nextTargets = allAchievements
      .filter((a) => !a.unlocked && !a.hidden)
      .filter((a) => a.progress !== undefined && a.maxProgress !== undefined)
      .sort((a, b) => {
        const progressA = (a.progress || 0) / (a.maxProgress || 1);
        const progressB = (b.progress || 0) / (b.maxProgress || 1);
        return progressB - progressA;
      })
      .slice(0, 3);

    return {
      achievements: allAchievements,
      unlockedCount: unlockedAchievements.length,
      totalCount: allAchievements.length,
      recentUnlocks,
      nextTargets,
    };
  }

  /**
   * Get achievement by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  /**
   * Reset all achievements (for testing or new players)
   */
  resetAchievements(): void {
    for (const achievement of this.achievements.values()) {
      achievement.unlocked = false;
      achievement.progress = 0;
      achievement.unlockedAt = undefined;
    }
  }

  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Completion Achievements
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your first puzzle',
        category: AchievementCategory.COMPLETION,
        tier: AchievementTier.BRONZE,
        requirements: [{ type: 'puzzle_count', value: 1, operator: 'gte' }],
        reward: { experience: 50, title: 'Puzzle Novice' },
        hidden: false,
        unlocked: false,
        maxProgress: 1,
      },
      {
        id: 'getting_started',
        name: 'Getting Started',
        description: 'Complete 5 puzzles',
        category: AchievementCategory.COMPLETION,
        tier: AchievementTier.BRONZE,
        requirements: [{ type: 'puzzle_count', value: 5, operator: 'gte' }],
        reward: { experience: 100, unlocks: ['hint_system'] },
        hidden: false,
        unlocked: false,
        maxProgress: 5,
      },
      {
        id: 'puzzle_enthusiast',
        name: 'Puzzle Enthusiast',
        description: 'Complete 25 puzzles',
        category: AchievementCategory.COMPLETION,
        tier: AchievementTier.SILVER,
        requirements: [{ type: 'puzzle_count', value: 25, operator: 'gte' }],
        reward: {
          experience: 250,
          title: 'Enthusiast',
          unlocks: ['custom_themes'],
        },
        hidden: false,
        unlocked: false,
        maxProgress: 25,
      },
      {
        id: 'puzzle_master',
        name: 'Puzzle Master',
        description: 'Complete 100 puzzles',
        category: AchievementCategory.COMPLETION,
        tier: AchievementTier.GOLD,
        requirements: [{ type: 'puzzle_count', value: 100, operator: 'gte' }],
        reward: {
          experience: 500,
          title: 'Puzzle Master',
          unlocks: ['master_tools'],
        },
        hidden: false,
        unlocked: false,
        maxProgress: 100,
      },

      // Performance Achievements
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a puzzle without using any hints',
        category: AchievementCategory.PERFORMANCE,
        tier: AchievementTier.BRONZE,
        requirements: [
          { type: 'custom', value: 0, condition: 'no_hints_single' },
        ],
        reward: { experience: 75, badge: 'no_hints' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a puzzle in under 30% of the time limit',
        category: AchievementCategory.PERFORMANCE,
        tier: AchievementTier.SILVER,
        requirements: [{ type: 'time', value: 0.3, operator: 'lte' }],
        reward: { experience: 150, badge: 'speed' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'efficiency_expert',
        name: 'Efficiency Expert',
        description:
          'Complete a puzzle using 50% or fewer moves than the limit',
        category: AchievementCategory.PERFORMANCE,
        tier: AchievementTier.SILVER,
        requirements: [{ type: 'efficiency', value: 0.5, operator: 'lte' }],
        reward: { experience: 150, badge: 'efficiency' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'flawless_victory',
        name: 'Flawless Victory',
        description:
          'Complete a hard puzzle perfectly (no hints, fast time, efficient moves)',
        category: AchievementCategory.PERFORMANCE,
        tier: AchievementTier.GOLD,
        requirements: [
          { type: 'difficulty', value: 4, operator: 'gte' },
          { type: 'custom', value: 0, condition: 'perfect_completion' },
        ],
        reward: { experience: 300, title: 'Flawless', badge: 'perfect' },
        hidden: false,
        unlocked: false,
      },

      // Streak Achievements
      {
        id: 'hot_streak',
        name: 'Hot Streak',
        description: 'Complete 3 puzzles in a row',
        category: AchievementCategory.STREAK,
        tier: AchievementTier.BRONZE,
        requirements: [{ type: 'streak', value: 3, operator: 'gte' }],
        reward: { experience: 100, bonuses: { streak_multiplier: 1.1 } },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Complete 10 puzzles in a row',
        category: AchievementCategory.STREAK,
        tier: AchievementTier.SILVER,
        requirements: [{ type: 'streak', value: 10, operator: 'gte' }],
        reward: {
          experience: 250,
          title: 'Unstoppable',
          bonuses: { streak_multiplier: 1.2 },
        },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'legendary_streak',
        name: 'Legendary Streak',
        description: 'Complete 25 puzzles in a row',
        category: AchievementCategory.STREAK,
        tier: AchievementTier.LEGENDARY,
        requirements: [{ type: 'streak', value: 25, operator: 'gte' }],
        reward: { experience: 500, title: 'Legend', badge: 'legendary_streak' },
        hidden: false,
        unlocked: false,
      },

      // Mastery Achievements
      {
        id: 'logic_specialist',
        name: 'Logic Specialist',
        description: 'Complete 10 logic grid puzzles',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.SILVER,
        requirements: [
          {
            type: 'puzzle_count',
            value: 10,
            operator: 'gte',
            puzzleType: PuzzleType.LOGIC_GRID,
          },
        ],
        reward: { experience: 200, title: 'Logic Specialist' },
        hidden: false,
        unlocked: false,
        maxProgress: 10,
      },
      {
        id: 'sequence_master',
        name: 'Sequence Master',
        description: 'Complete 10 sequence puzzles',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.SILVER,
        requirements: [
          {
            type: 'puzzle_count',
            value: 10,
            operator: 'gte',
            puzzleType: PuzzleType.SEQUENCE,
          },
        ],
        reward: { experience: 200, title: 'Sequence Master' },
        hidden: false,
        unlocked: false,
        maxProgress: 10,
      },
      {
        id: 'spatial_genius',
        name: 'Spatial Genius',
        description: 'Complete 10 spatial puzzles',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.SILVER,
        requirements: [
          {
            type: 'puzzle_count',
            value: 10,
            operator: 'gte',
            puzzleType: PuzzleType.SPATIAL,
          },
        ],
        reward: { experience: 200, title: 'Spatial Genius' },
        hidden: false,
        unlocked: false,
        maxProgress: 10,
      },

      // Difficulty Achievements
      {
        id: 'expert_level',
        name: 'Expert Level',
        description: 'Complete an expert difficulty puzzle',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.GOLD,
        requirements: [{ type: 'difficulty', value: 5, operator: 'gte' }],
        reward: { experience: 300, title: 'Expert' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'legendary_solver',
        name: 'Legendary Solver',
        description: 'Complete a legendary difficulty puzzle',
        category: AchievementCategory.MASTERY,
        tier: AchievementTier.LEGENDARY,
        requirements: [{ type: 'difficulty', value: 7, operator: 'gte' }],
        reward: { experience: 500, title: 'Legend', badge: 'legendary' },
        hidden: false,
        unlocked: false,
      },

      // Special Achievements
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete a puzzle between 10 PM and 6 AM',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.BRONZE,
        requirements: [{ type: 'custom', value: 0, condition: 'night_time' }],
        reward: { experience: 100, badge: 'night_owl' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete a puzzle between 5 AM and 8 AM',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.BRONZE,
        requirements: [
          { type: 'custom', value: 0, condition: 'early_morning' },
        ],
        reward: { experience: 100, badge: 'early_bird' },
        hidden: false,
        unlocked: false,
      },
      {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Complete 5 puzzles on weekends',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.SILVER,
        requirements: [
          { type: 'custom', value: 5, condition: 'weekend_puzzles' },
        ],
        reward: { experience: 200, bonuses: { weekend_bonus: 1.15 } },
        hidden: false,
        unlocked: false,
        maxProgress: 5,
      },

      // Hidden Achievements
      {
        id: 'secret_solver',
        name: 'Secret Solver',
        description: 'Discover the hidden achievement system',
        category: AchievementCategory.SPECIAL,
        tier: AchievementTier.GOLD,
        requirements: [
          { type: 'custom', value: 0, condition: 'view_achievements' },
        ],
        reward: {
          experience: 250,
          title: 'Secret Keeper',
          unlocks: ['hidden_puzzles'],
        },
        hidden: true,
        unlocked: false,
      },
    ];

    // Initialize achievements map
    achievements.forEach((achievement) => {
      achievement.progress = 0;
      this.achievements.set(achievement.id, achievement);
    });

    this.logger.debug(`Initialized ${achievements.length} achievements`);
  }

  private evaluateAchievement(
    achievement: Achievement,
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: any,
  ): boolean {
    return achievement.requirements.every((req) =>
      this.evaluateRequirement(req, puzzle, performance, playerStats),
    );
  }

  private evaluateRequirement(
    requirement: AchievementRequirement,
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: any,
  ): boolean {
    const {
      type,
      value,
      operator = 'gte',
      puzzleType,
      condition,
    } = requirement;

    let actualValue: number;

    switch (type) {
      case 'puzzle_count':
        actualValue = puzzleType
          ? playerStats.typeCompleted[puzzleType] || 0
          : playerStats.totalCompleted;
        break;

      case 'difficulty':
        actualValue = puzzle.difficulty;
        break;

      case 'time':
        const timeLimit = puzzle.timeLimit || 300000;
        actualValue = performance.timeSpent / timeLimit;
        break;

      case 'efficiency':
        const moveLimit = puzzle.maxMoves || 20;
        actualValue = performance.movesUsed / moveLimit;
        break;

      case 'streak':
        actualValue = playerStats.currentStreak;
        break;

      case 'score':
        actualValue = playerStats.totalScore;
        break;

      case 'custom':
        return this.evaluateCustomCondition(
          condition!,
          puzzle,
          performance,
          playerStats,
        );

      default:
        return false;
    }

    return this.compareValues(actualValue, value, operator);
  }

  private evaluateCustomCondition(
    condition: string,
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: any,
  ): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    switch (condition) {
      case 'no_hints_single':
        return performance.hintsUsed === 0;

      case 'perfect_completion':
        const timeLimit = puzzle.timeLimit || 300000;
        const moveLimit = puzzle.maxMoves || 20;
        return (
          performance.hintsUsed === 0 &&
          performance.timeSpent < timeLimit * 0.5 &&
          performance.movesUsed <= moveLimit * 0.8
        );

      case 'night_time':
        return hour >= 22 || hour < 6;

      case 'early_morning':
        return hour >= 5 && hour < 8;

      case 'weekend_puzzles':
        return day === 0 || day === 6;

      case 'view_achievements':
        // This would be triggered when player opens achievements page
        return false; // Handled separately

      default:
        return false;
    }
  }

  private compareValues(
    actual: number,
    expected: number,
    operator: string,
  ): boolean {
    switch (operator) {
      case 'gte':
        return actual >= expected;
      case 'lte':
        return actual <= expected;
      case 'gt':
        return actual > expected;
      case 'lt':
        return actual < expected;
      case 'eq':
        return actual === expected;
      default:
        return false;
    }
  }

  private updateAchievementProgress(
    achievement: Achievement,
    puzzle: IPuzzle,
    performance: PerformanceMetrics,
    playerStats: any,
  ): void {
    if (!achievement.maxProgress) return;

    const requirement = achievement.requirements[0]; // Assume single requirement for progress
    let currentProgress = 0;

    switch (requirement.type) {
      case 'puzzle_count':
        currentProgress = requirement.puzzleType
          ? playerStats.typeCompleted[requirement.puzzleType] || 0
          : playerStats.totalCompleted;
        break;

      case 'custom':
        if (requirement.condition === 'weekend_puzzles') {
          const day = new Date().getDay();
          if (day === 0 || day === 6) {
            currentProgress = (achievement.progress || 0) + 1;
          }
        }
        break;
    }

    achievement.progress = Math.min(currentProgress, achievement.maxProgress);
  }
}
