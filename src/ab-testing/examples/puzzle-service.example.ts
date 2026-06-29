/**
 * Example: How to use the A/B Testing service in a PuzzleService
 * 
 * This shows practical integration patterns for experiments and feature flags.
 */

import { Injectable } from '@nestjs/common';
import { ExperimentsService, PlayerContext } from '../experiments.service';

@Injectable()
export class PuzzleServiceExample {
  constructor(private readonly experimentsService: ExperimentsService) {}

  /**
   * Example 1: A/B test for puzzle difficulty algorithm
   */
  async calculatePuzzleDifficulty(userId: string, puzzleId: string): Promise<number> {
    // Assign user to experiment variant
    const assignment = await this.experimentsService.assignVariant(userId);
    
    if (assignment?.variantName === 'algorithm_v2') {
      // Use new algorithm for variant A
      return this.calculateDifficultyV2(userId, puzzleId);
    }
    
    // Use default algorithm for control group
    return this.calculateDifficultyV1(userId, puzzleId);
  }

  /**
   * Example 2: Feature flag for new UI components
   */
  async getPuzzleUIComponents(userId: string): Promise<UIComponents> {
    const playerContext = await this.getPlayerContext(userId);
    
    // Check multiple feature flags
    const showNewSidebar = await this.experimentsService.evaluateFlag(
      'new_sidebar_ui',
      playerContext
    );
    
    const showDarkMode = await this.experimentsService.evaluateFlag(
      'dark_mode_toggle',
      playerContext
    );
    
    const showSocialFeatures = await this.experimentsService.evaluateFlag(
      'social_features',
      playerContext
    );

    return {
      sidebar: showNewSidebar ? 'new' : 'old',
      theme: showDarkMode ? 'dark' : 'light',
      socialButtons: showSocialFeatures,
    };
  }

  /**
   * Example 3: Track conversion for experiment
   */
  async trackPuzzleCompletion(userId: string, puzzleId: string): Promise<void> {
    // Get experiment assignment
    const assignment = await this.experimentsService.assignVariant(userId);
    
    if (assignment) {
      // Track conversion event
      await this.experimentsService.trackConversion(assignment.experimentId, {
        user_id: userId,
        event_type: 'puzzle_completed',
      });
    }
    
    // Also track as general analytics
    await this.saveCompletionAnalytics(userId, puzzleId);
  }

  /**
   * Example 4: Gradual rollout of new feature
   */
  async shouldShowNewFeature(userId: string, featureKey: string): Promise<boolean> {
    const playerContext = await this.getPlayerContext(userId);
    
    return this.experimentsService.evaluateFlag(featureKey, playerContext);
  }

  /**
   * Example 5: Premium-only features
   */
  async getPremiumFeatures(userId: string): Promise<string[]> {
    const playerContext = await this.getPlayerContext(userId);
    const features: string[] = [];
    
    // Check each premium feature flag
    const premiumFlags = [
      'advanced_analytics',
      'custom_themes',
      'priority_support',
      'export_data',
    ];
    
    for (const flag of premiumFlags) {
      const enabled = await this.experimentsService.evaluateFlag(
        flag,
        playerContext
      );
      if (enabled) {
        features.push(flag);
      }
    }
    
    return features;
  }

  // ─── Helper methods ──────────────────────────────────────────────────────

  private async getPlayerContext(userId: string): Promise<PlayerContext> {
    // In real implementation, fetch from database
    return {
      userId,
      isPremium: await this.checkPremiumStatus(userId),
      accountAgeDays: await this.getAccountAgeDays(userId),
    };
  }

  private async checkPremiumStatus(userId: string): Promise<boolean> {
    // Implement premium check
    return false; // placeholder
  }

  private async getAccountAgeDays(userId: string): Promise<number> {
    // Implement account age calculation
    return 30; // placeholder
  }

  private calculateDifficultyV1(userId: string, puzzleId: string): number {
    // Original algorithm
    return 5; // placeholder
  }

  private calculateDifficultyV2(userId: string, puzzleId: string): number {
    // New algorithm being tested
    return 7; // placeholder
  }

  private async saveCompletionAnalytics(userId: string, puzzleId: string): Promise<void> {
    // Save to analytics database
  }
}

// ─── Type definitions ──────────────────────────────────────────────────────

interface UIComponents {
  sidebar: 'new' | 'old';
  theme: 'dark' | 'light';
  socialButtons: boolean;
}