import { Injectable } from '@nestjs/common';
import { ScoringEngineService, PuzzleFeatures } from './scoring-engine.service';
import { UserInteractionRepository } from '../data-access/user-interaction.repository';
import { PuzzleRepository } from '../data-access/puzzle.repository';
import { UserPreference } from '../entities/user-preference.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface ContentBasedRecommendation {
  puzzleId: string;
  score: number;
  reason: string;
  matchingFeatures: string[];
}

@Injectable()
export class ContentBasedFilteringAlgorithm {
  constructor(
    private scoringEngine: ScoringEngineService,
    private userInteractionRepo: UserInteractionRepository,
    private puzzleRepo: PuzzleRepository,
    @InjectRepository(UserPreference)
    private userPreferenceRepo: Repository<UserPreference>,
  ) {}

  async generateRecommendations(
    userId: string,
    limit: number = 10,
    category?: string,
    difficulty?: string,
  ): Promise<ContentBasedRecommendation[]> {
    // Get or create user preferences
    const userPreferences = await this.getUserPreferences(userId);
    
    // Get user's completed puzzles to avoid recommending them again
    const completedPuzzles = await this.userInteractionRepo.getCompletedPuzzleIds(userId);

    // Get candidate puzzles
    const candidatePuzzles = await this.puzzleRepo.findActivePuzzles({
      category,
      difficulty,
      excludeIds: completedPuzzles,
    }, limit * 3);

    // Score puzzles based on content similarity
    const scoredPuzzles = this.scorePuzzles(candidatePuzzles, userPreferences);

    return scoredPuzzles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async getUserPreferences(userId: string): Promise<UserPreference[]> {
    let preferences = await this.userPreferenceRepo.find({
      where: { userId },
    });

    // If no preferences exist, create them based on user interactions
    if (preferences.length === 0) {
      preferences = await this.createUserPreferencesFromHistory(userId);
    }

    return preferences;
  }

  private async createUserPreferencesFromHistory(userId: string): Promise<UserPreference[]> {
    const interactions = await this.userInteractionRepo.findUserCompletions(userId, 50);

    if (interactions.length === 0) {
      return this.createDefaultPreferences(userId);
    }

    // Analyze user's puzzle completion patterns
    const categoryStats = this.analyzeCategoryPreferences(interactions);
    const preferences: UserPreference[] = [];

    for (const [category, stats] of categoryStats) {
      const preference = this.userPreferenceRepo.create({
        userId,
        category,
        preferenceScore: stats.preferenceScore,
        difficulty: stats.preferredDifficulty,
        difficultyScore: stats.difficultyScore,
        tagPreferences: stats.tagPreferences,
        interactionCount: stats.interactionCount,
        averageCompletionTime: stats.averageCompletionTime,
        successRate: 1.0, // All interactions are completions
      });

      preferences.push(await this.userPreferenceRepo.save(preference));
    }

    return preferences;
  }

  private analyzeCategoryPreferences(interactions: any[]): Map<string, any> {
    const categoryMap = new Map();

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

      const categoryData = categoryMap.get(category);
      categoryData.interactions.push(interaction);
      
      const rating = interaction.value || 3.5;
      categoryData.totalRating += rating;
      
      const completionTime = interaction.metadata?.completionTime || 0;
      categoryData.totalTime += completionTime;
      
      const difficulty = interaction.puzzle.difficulty;
      categoryData.difficulties.set(difficulty, (categoryData.difficulties.get(difficulty) || 0) + 1);
      
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
      
      const difficultyScore = this.calculateDifficultyScore(data.difficulties, count);
      
      // Normalize tag preferences
      const tagPreferences: Record<string, number> = {};
      for (const [tag, totalRating] of data.tags) {
        const tagCount = data.interactions.filter((i: any) => i.puzzle.tags.includes(tag)).length;
        tagPreferences[tag] = (totalRating / tagCount) / 5.0;
      }
      
      analysisMap.set(category, {
        preferenceScore,
        preferredDifficulty,
        difficultyScore,
        tagPreferences,
        interactionCount: count,
        averageCompletionTime: avgTime,
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

  private async createDefaultPreferences(userId: string): Promise<UserPreference[]> {
    const defaultCategories = ['logic', 'math', 'pattern', 'word'];
    const preferences: UserPreference[] = [];

    for (const category of defaultCategories) {
      const preference = this.userPreferenceRepo.create({
        userId,
        category,
        preferenceScore: 0.5,
        difficulty: 'medium',
        difficultyScore: 0.5,
        tagPreferences: {},
        interactionCount: 0,
        averageCompletionTime: 0,
        successRate: 0,
      });

      preferences.push(await this.userPreferenceRepo.save(preference));
    }

    return preferences;
  }

  private scorePuzzles(
    puzzles: any[],
    userPreferences: UserPreference[],
  ): ContentBasedRecommendation[] {
    const scoredPuzzles: ContentBasedRecommendation[] = [];

    for (const puzzle of puzzles) {
      const features = this.extractPuzzleFeatures(puzzle);
      const { score, matchingFeatures, reason } = this.calculateContentSimilarity(features, userPreferences);

      scoredPuzzles.push({
        puzzleId: puzzle.id,
        score,
        reason,
        matchingFeatures,
      });
    }

    return scoredPuzzles;
  }

  private extractPuzzleFeatures(puzzle: any): PuzzleFeatures {
    return {
      category: puzzle.category,
      difficulty: puzzle.difficulty,
      difficultyRating: puzzle.difficultyRating,
      tags: puzzle.tags,
      averageRating: puzzle.averageRating,
      completionRate: puzzle.completionRate,
      ageInDays: puzzle.ageInDays,
    };
  }

  private calculateContentSimilarity(
    puzzleFeatures: PuzzleFeatures,
    userPreferences: UserPreference[],
  ): { score: number; matchingFeatures: string[]; reason: string } {
    let totalScore = 0;
    let weightSum = 0;
    const matchingFeatures: string[] = [];

    // Find matching category preference
    const categoryPreference = userPreferences.find(p => p.category === puzzleFeatures.category);
    if (categoryPreference) {
      const categoryWeight = 0.4;
      totalScore += categoryPreference.preferenceScore * categoryWeight;
      weightSum += categoryWeight;
      matchingFeatures.push(`${puzzleFeatures.category} category`);

      // Difficulty matching within category
      const difficultyWeight = 0.3;
      const difficultyMatch = this.calculateDifficultyMatch(
        puzzleFeatures.difficulty,
        categoryPreference.difficulty,
      );
      totalScore += difficultyMatch * difficultyWeight;
      weightSum += difficultyWeight;

      if (difficultyMatch > 0.7) {
        matchingFeatures.push(`${puzzleFeatures.difficulty} difficulty`);
      }

      // Tag similarity
      const tagWeight = 0.2;
      const { similarity: tagSimilarity, matchingTags } = this.calculateTagSimilarity(
        puzzleFeatures.tags,
        categoryPreference.tagPreferences,
      );
      totalScore += tagSimilarity * tagWeight;
      weightSum += tagWeight;

      if (matchingTags.length > 0) {
        matchingFeatures.push(...matchingTags);
      }
    }

    // Quality score
    const qualityWeight = 0.1;
    const qualityScore = this.scoringEngine.calculateQualityScore(puzzleFeatures);
    totalScore += qualityScore * qualityWeight;
    weightSum += qualityWeight;

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;
    const reason = this.generateRecommendationReason(puzzleFeatures, matchingFeatures, finalScore);

    return { score: finalScore, matchingFeatures, reason };
  }

  private calculateDifficultyMatch(puzzleDifficulty: string, preferredDifficulty: string): number {
    const difficultyOrder = ['easy', 'medium', 'hard', 'expert'];
    const puzzleIndex = difficultyOrder.indexOf(puzzleDifficulty);
    const preferredIndex = difficultyOrder.indexOf(preferredDifficulty);

    if (puzzleIndex === -1 || preferredIndex === -1) return 0.5;

    const distance = Math.abs(puzzleIndex - preferredIndex);
    return Math.max(0, 1 - distance * 0.3);
  }

  private calculateTagSimilarity(
    puzzleTags: string[],
    userTagPreferences: Record<string, number>,
  ): { similarity: number; matchingTags: string[] } {
    if (puzzleTags.length === 0 || Object.keys(userTagPreferences).length === 0) {
      return { similarity: 0.5, matchingTags: [] };
    }

    let totalSimilarity = 0;
    let matchingTagCount = 0;
    const matchingTags: string[] = [];

    for (const tag of puzzleTags) {
      if (userTagPreferences[tag] !== undefined) {
        totalSimilarity += userTagPreferences[tag];
        matchingTagCount++;
        if (userTagPreferences[tag] > 0.6) {
          matchingTags.push(tag);
        }
      }
    }

    const similarity = matchingTagCount > 0 ? totalSimilarity / matchingTagCount : 0.3;
    return { similarity, matchingTags };
  }

  private generateRecommendationReason(
    features: PuzzleFeatures,
    matchingFeatures: string[],
    score: number,
  ): string {
    if (matchingFeatures.length === 0) {
      return `New ${features.category} puzzle to explore`;
    }

    const reasons: string[] = [];

    if (matchingFeatures.includes(`${features.category} category`)) {
      reasons.push(`matches your ${features.category} preference`);
    }

    if (features.averageRating > 4.0) {
      reasons.push('highly rated by other players');
    }

    if (features.completionRate > 0.8) {
      reasons.push('has a good completion rate');
    }

    const tagMatches = matchingFeatures.filter(f => !f.includes('category') && !f.includes('difficulty'));
    if (tagMatches.length > 0) {
      reasons.push(`features ${tagMatches.slice(0, 2).join(', ')}`);
    }

    return reasons.length > 0 
      ? `Recommended because it ${reasons.join(' and ')}`
      : `Similar to puzzles you've enjoyed`;
  }
}