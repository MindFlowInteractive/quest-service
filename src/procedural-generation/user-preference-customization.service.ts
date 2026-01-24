/**
 * User Preference-Based Generation Customization
 * Personalizes puzzle generation based on user preferences
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  UserPreferences,
  PersonalizationContext,
  DifficultyLevel,
  PuzzleType,
  GenerationConfig,
  GeneratedPuzzle,
} from './types';

interface PersonalizedGenerationResult {
  puzzle: GeneratedPuzzle;
  personalizationScore: number;
  adaptiveChallenge: boolean;
  recommendedNextDifficulty: DifficultyLevel;
}

@Injectable()
export class UserPreferenceCustomizationService {
  private readonly logger = new Logger(UserPreferenceCustomizationService.name);

  private readonly userPreferences: Map<string, UserPreferences> = new Map();

  /**
   * Creates or updates user preferences
   */
  setUserPreferences(userId: string, preferences: Partial<UserPreferences>): UserPreferences {
    const existing = this.userPreferences.get(userId);

    const updated: UserPreferences = {
      userId,
      preferredCategories: preferences.preferredCategories || ['logic', 'pattern', 'math'],
      difficultyRange: preferences.difficultyRange || ['easy', 'hard'],
      avoidPatterns: preferences.avoidPatterns || [],
      preferredThemes: preferences.preferredThemes || [],
      diversityPreference: preferences.diversityPreference ?? 0.7,
      noveltyPreference: preferences.noveltyPreference ?? 0.6,
      difficultyProgression: preferences.difficultyProgression || 'adaptive',
    };

    this.userPreferences.set(userId, updated);
    return updated;
  }

  /**
   * Gets user preferences
   */
  getUserPreferences(userId: string): UserPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  /**
   * Generates personalized config based on user preferences and context
   */
  generatePersonalizedConfig(
    userId: string,
    context: PersonalizationContext,
  ): GenerationConfig {
    const preferences = this.userPreferences.get(userId);

    if (!preferences) {
      // Return default if no preferences
      return {
        puzzleType: 'logic',
        difficulty: 'medium',
      };
    }

    // Select puzzle type based on preferences and diversity
    const puzzleType = this.selectPuzzleType(preferences, context);

    // Determine difficulty based on skill and progression
    const difficulty = this.determineDifficulty(preferences, context);

    // Generate custom parameters
    const parameters = this.generateCustomParameters(preferences, context, puzzleType, difficulty);

    return {
      puzzleType,
      difficulty,
      parameters,
    };
  }

  /**
   * Selects puzzle type based on preferences
   */
  private selectPuzzleType(
    preferences: UserPreferences,
    context: PersonalizationContext,
  ): PuzzleType {
    // Consider user preferences and recent performance
    const preferredTypes = preferences.preferredCategories;

    if (preferredTypes.length === 0) {
      return 'logic';
    }

    // If diversity preference is high, sometimes pick from non-preferred
    if (preferences.diversityPreference > 0.7 && Math.random() < 0.3) {
      const allTypes: PuzzleType[] = ['logic', 'pattern', 'math', 'word', 'visual'];
      const nonPreferred = allTypes.filter((t) => !preferredTypes.includes(t));
      if (nonPreferred.length > 0) {
        return nonPreferred[Math.floor(Math.random() * nonPreferred.length)];
      }
    }

    // Otherwise pick from preferred
    return preferredTypes[Math.floor(Math.random() * preferredTypes.length)];
  }

  /**
   * Determines appropriate difficulty for user
   */
  private determineDifficulty(
    preferences: UserPreferences,
    context: PersonalizationContext,
  ): DifficultyLevel {
    const [minDiff, maxDiff] = preferences.difficultyRange;
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];

    // Map to difficulty indices
    const minIdx = difficultyLevels.indexOf(minDiff);
    const maxIdx = difficultyLevels.indexOf(maxDiff);

    // Adaptive difficulty based on skill and success rate
    if (preferences.difficultyProgression === 'adaptive') {
      const skillFactor = context.skillLevel / 10; // 0-1
      const successFactor = context.recentPerformance.successRate; // 0-1

      // Adjust based on performance
      if (successFactor > 0.8) {
        // User is doing well, increase difficulty
        return difficultyLevels[Math.min(maxIdx, minIdx + 2)];
      } else if (successFactor < 0.4) {
        // User is struggling, decrease difficulty
        return difficultyLevels[Math.max(minIdx, maxIdx - 2)];
      } else {
        // Maintain or slightly adjust
        const baseIdx = Math.floor(minIdx + (maxIdx - minIdx) * skillFactor);
        return difficultyLevels[baseIdx];
      }
    }

    // Static difficulty progression
    if (preferences.difficultyProgression === 'ascending') {
      const progression = [minIdx, minIdx, minIdx + 1, minIdx + 1, minIdx + 2, maxIdx];
      const idx = Math.min(Math.floor(context.skillLevel), progression.length - 1);
      return difficultyLevels[progression[idx]];
    }

    // Default: middle of range
    const middleIdx = Math.floor((minIdx + maxIdx) / 2);
    return difficultyLevels[middleIdx];
  }

  /**
   * Generates custom parameters based on user profile
   */
  private generateCustomParameters(
    preferences: UserPreferences,
    context: PersonalizationContext,
    puzzleType: PuzzleType,
    difficulty: DifficultyLevel,
  ): Record<string, any> {
    const parameters: Record<string, any> = {
      userSkillAdjustment: context.skillLevel / 10,
      playStyle: context.playStyle,
    };

    // Adjust based on play style
    if (context.playStyle === 'fast') {
      parameters.generateSpeed = 'optimized';
      parameters.complexityPenalty = 0.9;
    } else if (context.playStyle === 'hint-dependent') {
      parameters.hintCount = 5;
      parameters.hintFrequency = 'frequent';
    } else {
      parameters.generateSpeed = 'thorough';
      parameters.complexityPenalty = 1.0;
    }

    // Add theme preferences
    if (preferences.preferredThemes && preferences.preferredThemes.length > 0) {
      parameters.theme = preferences.preferredThemes[0];
    }

    // Add diversity settings
    parameters.diversityPenalty = 1 - preferences.diversityPreference;
    parameters.noveltyFactor = preferences.noveltyPreference;

    return parameters;
  }

  /**
   * Evaluates puzzle personalization fit
   */
  evaluatePersonalizationFit(
    userId: string,
    puzzle: GeneratedPuzzle,
    context: PersonalizationContext,
  ): PersonalizedGenerationResult {
    const preferences = this.userPreferences.get(userId);

    if (!preferences) {
      return {
        puzzle,
        personalizationScore: 0.5,
        adaptiveChallenge: false,
        recommendedNextDifficulty: 'medium',
      };
    }

    let score = 0;
    let factors = 0;

    // Type preference match (40%)
    if (preferences.preferredCategories.includes(puzzle.type)) {
      score += 0.4;
    }
    factors += 0.4;

    // Difficulty range match (40%)
    const [minDiff, maxDiff] = preferences.difficultyRange;
    const diffLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const minIdx = diffLevels.indexOf(minDiff);
    const maxIdx = diffLevels.indexOf(maxDiff);
    const puzzleIdx = diffLevels.indexOf(puzzle.difficulty);

    if (puzzleIdx >= minIdx && puzzleIdx <= maxIdx) {
      score += 0.4;
    }
    factors += 0.4;

    // Avoid patterns (20%)
    if (preferences.avoidPatterns && preferences.avoidPatterns.length > 0) {
      const contentStr = JSON.stringify(puzzle.content);
      const hasAvoidedPattern = preferences.avoidPatterns.some((pattern) =>
        contentStr.includes(pattern),
      );

      if (!hasAvoidedPattern) {
        score += 0.2;
      }
    } else {
      score += 0.2;
    }
    factors += 0.2;

    const personalizationScore = factors > 0 ? score / factors : 0.5;

    // Determine next difficulty recommendation
    const nextDifficulty = this.recommendNextDifficulty(context);

    // Check if should apply adaptive challenge
    const adaptiveChallenge = preferences.difficultyProgression === 'adaptive';

    return {
      puzzle,
      personalizationScore,
      adaptiveChallenge,
      recommendedNextDifficulty: nextDifficulty,
    };
  }

  /**
   * Recommends next difficulty based on performance
   */
  private recommendNextDifficulty(context: PersonalizationContext): DifficultyLevel {
    const successRate = context.recentPerformance.successRate;

    if (successRate > 0.85) {
      return 'hard';
    } else if (successRate > 0.70) {
      return 'medium';
    } else if (successRate < 0.40) {
      return 'easy';
    } else {
      return 'medium';
    }
  }

  /**
   * Updates user preferences based on engagement
   */
  updatePreferencesFromEngagement(
    userId: string,
    engagement: {
      puzzleType: PuzzleType;
      success: boolean;
      timeToCompletion: number;
      hintsUsed: number;
    },
  ): void {
    let preferences = this.userPreferences.get(userId);

    if (!preferences) {
      preferences = {
        userId,
        preferredCategories: ['logic', 'pattern', 'math'],
        difficultyRange: ['easy', 'hard'],
        avoidPatterns: [],
        preferredThemes: [],
        diversityPreference: 0.7,
        noveltyPreference: 0.6,
        difficultyProgression: 'adaptive',
      };
    }

    // Increase preference for completed puzzle types
    if (engagement.success) {
      if (!preferences.preferredCategories.includes(engagement.puzzleType)) {
        preferences.preferredCategories.push(engagement.puzzleType);
      }

      // Boost novelty preference if quick solve
      if (engagement.timeToCompletion < 120000) {
        // < 2 minutes
        preferences.noveltyPreference = Math.min(1, preferences.noveltyPreference + 0.05);
      }
    } else {
      // Decrease preference for failed types
      const idx = preferences.preferredCategories.indexOf(engagement.puzzleType);
      if (idx > -1 && preferences.preferredCategories.length > 1) {
        preferences.preferredCategories.splice(idx, 1);
      }

      // Reduce novelty preference if struggling
      if (engagement.hintsUsed > 3) {
        preferences.noveltyPreference = Math.max(0, preferences.noveltyPreference - 0.05);
      }
    }

    this.userPreferences.set(userId, preferences);
  }

  /**
   * Gets personalization recommendations
   */
  getPersonalizationRecommendations(userId: string): {
    currentPreferences: UserPreferences | null;
    recommendations: string[];
  } {
    const preferences = this.getUserPreferences(userId);
    const recommendations: string[] = [];

    if (!preferences) {
      recommendations.push('Create user profile to enable personalized generation');
      return { currentPreferences: null, recommendations };
    }

    // Analyze diversity
    if (preferences.preferredCategories.length < 3) {
      recommendations.push('Diversify puzzle types for better learning');
    }

    // Analyze difficulty range
    const [minDiff, maxDiff] = preferences.difficultyRange;
    const diffLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const minIdx = diffLevels.indexOf(minDiff);
    const maxIdx = diffLevels.indexOf(maxDiff);

    if (maxIdx - minIdx < 2) {
      recommendations.push('Expand difficulty range for better progression');
    }

    // Analyze progression
    if (preferences.difficultyProgression === 'static') {
      recommendations.push('Switch to adaptive difficulty for better challenge');
    }

    // Analyze preferences
    if (preferences.noveltyPreference < 0.5) {
      recommendations.push('Increase novelty preference for fresh challenges');
    }

    if (preferences.diversityPreference < 0.5) {
      recommendations.push('Increase diversity to explore different puzzle types');
    }

    return { currentPreferences: preferences, recommendations };
  }
}
