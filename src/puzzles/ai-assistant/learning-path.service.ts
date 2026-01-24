import { Injectable } from '@nestjs/common';
import { LearningPath } from './interfaces/puzzle-analysis.interface';

@Injectable()
export class LearningPathService {
  private playerProfiles: Map<string, any> = new Map();

  async getPlayerProfile(userId: string): Promise<any> {
    if (!this.playerProfiles.has(userId)) {
      return this.createDefaultProfile();
    }
    return this.playerProfiles.get(userId);
  }

  async generateRecommendations(userId: string): Promise<LearningPath> {
    const profile = await this.getPlayerProfile(userId);
    
    return {
      currentLevel: this.assessCurrentLevel(profile),
      masteredStrategies: profile.masteredStrategies || [],
      recommendedPuzzles: this.recommendPuzzles(profile),
      focusAreas: this.identifyFocusAreas(profile),
      estimatedProgress: this.calculateOverallProgress(profile),
    };
  }

  async updatePlayerProfile(
    userId: string,
    puzzleId: string,
    performance: any
  ): Promise<void> {
    let profile = await this.getPlayerProfile(userId);
    
    // Update mastered strategies
    if (performance.strategiesUsed) {
      profile.masteredStrategies = this.updateMasteredStrategies(
        profile.masteredStrategies,
        performance.strategiesUsed,
        performance.success
      );
    }

    // Track puzzle completions
    if (!profile.completedPuzzles) {
      profile.completedPuzzles = [];
    }
    profile.completedPuzzles.push({
      puzzleId,
      timestamp: new Date(),
      performance,
    });

    // Update difficulty comfort level
    profile.comfortableDifficulty = this.updateDifficultyLevel(
      profile.comfortableDifficulty,
      performance
    );

    this.playerProfiles.set(userId, profile);
  }

  private createDefaultProfile(): any {
    return {
      masteredStrategies: ['basic_logic', 'observation'],
      completedPuzzles: [],
      comfortableDifficulty: 2,
      learningPace: 'moderate',
    };
  }

  private assessCurrentLevel(profile: any): string {
    const strategyCount = profile.masteredStrategies?.length || 0;
    
    if (strategyCount < 3) return 'beginner';
    if (strategyCount < 7) return 'intermediate';
    if (strategyCount < 12) return 'advanced';
    return 'expert';
  }

  private recommendPuzzles(profile: any): string[] {
    const recommendations: string[] = [];
    const difficulty = profile.comfortableDifficulty || 2;
    
    // Recommend puzzles at current level and slightly above
    recommendations.push(
      `puzzle_difficulty_${difficulty}`,
      `puzzle_difficulty_${difficulty + 1}`,
      `strategy_practice_${this.getNextStrategy(profile)}`
    );

    return recommendations;
  }

  private identifyFocusAreas(profile: any): string[] {
    const allStrategies = [
      'elimination',
      'pattern_recognition',
      'working_backwards',
      'constraint_propagation',
      'divide_conquer',
      'logical_deduction',
      'spatial_reasoning',
    ];

    const mastered = new Set(profile.masteredStrategies || []);
    
    return allStrategies
      .filter(strategy => !mastered.has(strategy))
      .slice(0, 3);
  }

  private calculateOverallProgress(profile: any): number {
    const totalStrategies = 15; // Total number of strategies to master
    const masteredCount = profile.masteredStrategies?.length || 0;
    
    return Math.round((masteredCount / totalStrategies) * 100);
  }

  private updateMasteredStrategies(
    current: string[],
    used: string[],
    success: boolean
  ): string[] {
    if (!success) return current;
    
    const updated = new Set([...current, ...used]);
    return Array.from(updated);
  }

  private updateDifficultyLevel(current: number, performance: any): number {
    if (performance.success && performance.hintsUsed < 2) {
      return Math.min(current + 0.5, 10);
    }
    if (!performance.success && performance.hintsUsed > 5) {
      return Math.max(current - 0.3, 1);
    }
    return current;
  }

  private getNextStrategy(profile: any): string {
    const focusAreas = this.identifyFocusAreas(profile);
    return focusAreas[0] || 'pattern_recognition';
  }
}
