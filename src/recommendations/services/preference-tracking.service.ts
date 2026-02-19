import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../entities/user-preference.entity';
import { UserInteraction } from '../entities/user-interaction.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { PuzzleRating } from '../../puzzles/entities/puzzle-rating.entity';

@Injectable()
export class PreferenceTrackingService {
  private readonly logger = new Logger(PreferenceTrackingService.name);

  constructor(
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    @InjectRepository(PuzzleRating)
    private puzzleRatingRepository: Repository<PuzzleRating>,
  ) {}

  async updateUserPreferences(userId: string): Promise<void> {
    try {
      // Get recent user interactions (last 50 completions)
      const recentInteractions = await this.userInteractionRepository.find({
        where: { 
          userId,
          interactionType: 'complete'
        },
        relations: ['puzzle'],
        order: { createdAt: 'DESC' },
        take: 50,
      });

      if (recentInteractions.length === 0) {
        return;
      }

      // Analyze interactions by category
      const categoryAnalysis = this.analyzeCategoryPreferences(recentInteractions);
      
      // Update or create preferences for each category
      for (const [category, analysis] of categoryAnalysis) {
        await this.updateCategoryPreference(userId, category, analysis);
      }

      this.logger.log(`Updated preferences for user ${userId} based on ${recentInteractions.length} interactions`);
    } catch (error) {
      this.logger.error(`Error updating preferences for user ${userId}:`, error);
    }
  }

  private analyzeCategoryPreferences(interactions: UserInteraction[]): Map<string, any> {
    const categoryMap = new Map<string, {
      interactions: UserInteraction[];
      totalRating: number;
      totalTime: number;
      difficulties: Map<string, number>;
      tags: Map<string, number>;
    }>();

    // Group interactions by category
    for (const interaction of interactions) {
      const category = interaction.puzzle.category;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          interactions: [],
          totalRating: 0,
          totalTime: 0,
          difficulties: new Map(),
          tags: new Map(),
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.interactions.push(interaction);
      
      // Accumulate ratings (use default if not provided)
      const rating = interaction.value || 3.5;
      categoryData.totalRating += rating;
      
      // Accumulate completion times
      const completionTime = interaction.metadata?.completionTime || 0;
      categoryData.totalTime += completionTime;
      
      // Track difficulty preferences
      const difficulty = interaction.puzzle.difficulty;
      categoryData.difficulties.set(difficulty, (categoryData.difficulties.get(difficulty) || 0) + 1);
      
      // Track tag preferences
      for (const tag of interaction.puzzle.tags) {
        categoryData.tags.set(tag, (categoryData.tags.get(tag) || 0) + rating);
      }
    }

    // Calculate preference scores for each category
    const analysisMap = new Map();
    
    for (const [category, data] of categoryMap) {
      const count = data.interactions.length;
      const avgRating = data.totalRating / count;
      const avgTime = data.totalTime / count;
      
      // Calculate preference score based on rating and frequency
      const frequencyScore = Math.min(count / interactions.length, 1.0);
      const ratingScore = avgRating / 5.0;
      const preferenceScore = (frequencyScore * 0.6) + (ratingScore * 0.4);
      
      // Find preferred difficulty
      let preferredDifficulty = 'medium';
      let maxDifficultyCount = 0;
      for (const [difficulty, diffCount] of data.difficulties) {
        if (diffCount > maxDifficultyCount) {
          maxDifficultyCount = diffCount;
          preferredDifficulty = difficulty;
        }
      }
      
      // Calculate difficulty score
      const difficultyScore = this.calculateDifficultyScore(data.difficulties, count);
      
      // Normalize tag preferences
      const tagPreferences: Record<string, number> = {};
      for (const [tag, totalRating] of data.tags) {
        const tagCount = data.interactions.filter(i => i.puzzle.tags.includes(tag)).length;
        tagPreferences[tag] = (totalRating / tagCount) / 5.0; // Normalize to 0-1
      }
      
      // Calculate success rate (all interactions are completions, so this is always 1.0)
      const successRate = 1.0;
      
      analysisMap.set(category, {
        preferenceScore,
        preferredDifficulty,
        difficultyScore,
        tagPreferences,
        interactionCount: count,
        averageCompletionTime: avgTime,
        successRate,
      });
    }

    return analysisMap;
  }

  private calculateDifficultyScore(difficulties: Map<string, number>, totalCount: number): number {
    const difficultyOrder = ['easy', 'medium', 'hard', 'expert'];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [difficulty, count] of difficulties) {
      const difficultyIndex = difficultyOrder.indexOf(difficulty);
      if (difficultyIndex !== -1) {
        const weight = count / totalCount;
        weightedSum += (difficultyIndex / (difficultyOrder.length - 1)) * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  }

  private async updateCategoryPreference(
    userId: string,
    category: string,
    analysis: any,
  ): Promise<void> {
    let preference = await this.userPreferenceRepository.findOne({
      where: { userId, category },
    });

    if (preference) {
      // Update existing preference with exponential moving average
      const alpha = 0.3; // Learning rate
      preference.preferenceScore = (1 - alpha) * preference.preferenceScore + alpha * analysis.preferenceScore;
      preference.difficulty = analysis.preferredDifficulty;
      preference.difficultyScore = (1 - alpha) * preference.difficultyScore + alpha * analysis.difficultyScore;
      preference.tagPreferences = this.mergeTagPreferences(preference.tagPreferences, analysis.tagPreferences, alpha);
      preference.interactionCount = analysis.interactionCount;
      preference.averageCompletionTime = analysis.averageCompletionTime;
      preference.successRate = analysis.successRate;
    } else {
      // Create new preference
      preference = this.userPreferenceRepository.create({
        userId,
        category,
        preferenceScore: analysis.preferenceScore,
        difficulty: analysis.preferredDifficulty,
        difficultyScore: analysis.difficultyScore,
        tagPreferences: analysis.tagPreferences,
        interactionCount: analysis.interactionCount,
        averageCompletionTime: analysis.averageCompletionTime,
        successRate: analysis.successRate,
      });
    }

    await this.userPreferenceRepository.save(preference);
  }

  private mergeTagPreferences(
    existing: Record<string, number>,
    newPrefs: Record<string, number>,
    alpha: number,
  ): Record<string, number> {
    const merged = { ...existing };

    for (const [tag, newScore] of Object.entries(newPrefs)) {
      if (merged[tag] !== undefined) {
        merged[tag] = (1 - alpha) * merged[tag] + alpha * newScore;
      } else {
        merged[tag] = newScore;
      }
    }

    return merged;
  }

  async onPuzzleCompleted(
    userId: string,
    puzzleId: string,
    completionTime: number,
    hintsUsed: number,
    attempts: number,
    score: number,
  ): Promise<void> {
    // Record the interaction
    const interaction = this.userInteractionRepository.create({
      userId,
      puzzleId,
      interactionType: 'complete' as any,
      value: 5.0, // Default positive rating for completion
      metadata: {
        completionTime,
        hintsUsed,
        attempts,
        score,
        source: 'game_completion',
      },
    } as any);

    await this.userInteractionRepository.save(interaction);

    // Update preferences asynchronously
    setImmediate(() => {
      this.updateUserPreferences(userId).catch(error => {
        this.logger.error(`Failed to update preferences after puzzle completion:`, error);
      });
    });
  }

  async onPuzzleRated(
    userId: string,
    puzzleId: string,
    rating: number,
    difficultyVote?: string,
  ): Promise<void> {
    // Record the rating interaction
    const interaction = this.userInteractionRepository.create({
      userId,
      puzzleId,
      interactionType: 'rate' as any,
      value: rating,
      metadata: {
        difficultyVote,
        source: 'explicit_rating',
      },
    } as any);

    await this.userInteractionRepository.save(interaction);

    // Update preferences to reflect the explicit rating
    setImmediate(() => {
      this.updateUserPreferences(userId).catch(error => {
        this.logger.error(`Failed to update preferences after rating:`, error);
      });
    });
  }

  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    return this.userPreferenceRepository.find({
      where: { userId },
      order: { preferenceScore: 'DESC' },
    });
  }

  async getTopCategories(userId: string, limit: number = 5): Promise<string[]> {
    const preferences = await this.userPreferenceRepository.find({
      where: { userId },
      order: { preferenceScore: 'DESC' },
      take: limit,
    });

    return preferences.map(p => p.category);
  }

  async getPreferenceInsights(userId: string): Promise<any> {
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences.length === 0) {
      return {
        topCategories: [],
        preferredDifficulty: 'medium',
        totalInteractions: 0,
        averageCompletionTime: 0,
        topTags: [],
      };
    }

    const totalInteractions = preferences.reduce((sum, p) => sum + p.interactionCount, 0);
    const weightedAvgTime = preferences.reduce((sum, p) => 
      sum + (p.averageCompletionTime * p.interactionCount), 0) / totalInteractions;

    // Find most preferred difficulty across all categories
    const difficultyVotes = new Map<string, number>();
    for (const pref of preferences) {
      const current = difficultyVotes.get(pref.difficulty) || 0;
      difficultyVotes.set(pref.difficulty, current + pref.interactionCount);
    }

    let preferredDifficulty = 'medium';
    let maxVotes = 0;
    for (const [difficulty, votes] of difficultyVotes) {
      if (votes > maxVotes) {
        maxVotes = votes;
        preferredDifficulty = difficulty;
      }
    }

    // Aggregate top tags across all categories
    const allTags = new Map<string, number>();
    for (const pref of preferences) {
      for (const [tag, score] of Object.entries(pref.tagPreferences)) {
        const current = allTags.get(tag) || 0;
        allTags.set(tag, current + score * pref.interactionCount);
      }
    }

    const topTags = Array.from(allTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      topCategories: preferences.slice(0, 5).map(p => ({
        category: p.category,
        score: p.preferenceScore,
        interactions: p.interactionCount,
      })),
      preferredDifficulty,
      totalInteractions,
      averageCompletionTime: Math.round(weightedAvgTime),
      topTags,
    };
  }
}