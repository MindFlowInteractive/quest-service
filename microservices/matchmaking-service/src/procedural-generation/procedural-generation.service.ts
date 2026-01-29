/**
 * Main Procedural Generation Service
 * Orchestrates all generation systems
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GenerationConfig,
  GeneratedPuzzle,
  GenerationResult,
  PersonalizationContext,
  GenerationDebugInfo,
  ValidationStep,
  DebugIssue,
  PerformanceMetrics,
} from './types';

import { ProcedularGenerationAlgorithms } from './algorithms';
import { DifficultyAwareGenerationService } from './difficulty-aware-generation.service';
import { GenerationQualityAssessmentService } from './quality-assessment.service';
import { ParameterTuningService } from './parameter-tuning.service';
import { VarietyAndUniquenessService } from './variety-uniqueness.service';
import { PerformanceOptimizationService } from './performance-optimization.service';
import { GenerationAnalyticsService } from './analytics.service';
import { UserPreferenceCustomizationService } from './user-preference-customization.service';

@Injectable()
export class ProceduralGenerationService {
  private readonly logger = new Logger(ProceduralGenerationService.name);

  constructor(
    private readonly algorithms: ProcedularGenerationAlgorithms,
    private readonly difficultyAware: DifficultyAwareGenerationService,
    private readonly qualityAssessment: GenerationQualityAssessmentService,
    private readonly parameterTuning: ParameterTuningService,
    private readonly varietyUniqueness: VarietyAndUniquenessService,
    private readonly performanceOptimization: PerformanceOptimizationService,
    private readonly analytics: GenerationAnalyticsService,
    private readonly userPreferences: UserPreferenceCustomizationService,
  ) {}

  /**
   * Main generation pipeline
   */
  async generatePuzzle(
    config: GenerationConfig,
    userId?: string,
  ): Promise<{
    puzzle: GeneratedPuzzle;
    validationPassed: boolean;
    metrics: any;
  }> {
    const startTime = Date.now();

    try {
      // 1. Check cache
      const cacheKey = this.performanceOptimization.generateCacheKey(config);
      let puzzle = this.performanceOptimization.getFromCache(cacheKey);

      if (puzzle) {
        this.logger.debug(`Cache hit for puzzle type: ${config.puzzleType}`);
        return { puzzle, validationPassed: true, metrics: { fromCache: true } };
      }

      // 2. Generate puzzle
      const genStartTime = Date.now();
      const generationResult = await this.algorithms.generatePuzzle(config);
      puzzle = generationResult.puzzle;
      const genTime = Date.now() - genStartTime;
      this.performanceOptimization.recordGenerationTime(genTime);

      // 3. Calibrate difficulty
      const { calibrated } = await this.difficultyAware.calibrateDifficulty(
        puzzle,
        config.difficulty,
      );
      puzzle = calibrated;

      // 4. Quality assessment
      const validStartTime = Date.now();
      const quality = this.qualityAssessment.assessQuality(puzzle);
      const validTime = Date.now() - validStartTime;
      this.performanceOptimization.recordValidationTime(validTime);

      if (!quality.passesStandards) {
        this.analytics.logGenerationEvent('failed', puzzle, {
          reason: 'quality_check_failed',
          issues: quality.issues,
        });
        // Regenerate if failed
        return this.generatePuzzle(config, userId);
      }

      // 5. Ensure uniqueness
      const uniqueness = this.varietyUniqueness.ensureUniqueness(puzzle);
      if (!uniqueness.isUnique) {
        this.analytics.logGenerationEvent('failed', puzzle, {
          reason: 'not_unique',
          similar: uniqueness.similarPuzzles.length,
        });
        // Regenerate with new seed
        const newConfig = { ...config, seed: Math.floor(Math.random() * 1000000) };
        return this.generatePuzzle(newConfig, userId);
      }

      // 6. Track variety
      this.varietyUniqueness.trackVariety(puzzle);

      // 7. Apply personalization if user provided
      if (userId) {
        const context: PersonalizationContext = {
          userId,
          recentPerformance: {
            successRate: 0.7,
            averageSolveTime: 300,
            preferredTypes: [],
          },
          skillLevel: 5,
          playStyle: 'thoughtful',
        };

        const personalized = this.userPreferences.evaluatePersonalizationFit(
          userId,
          puzzle,
          context,
        );
        puzzle = personalized.puzzle;
      }

      // 8. Cache result
      this.performanceOptimization.storeInCache(cacheKey, puzzle);

      // 9. Log analytics
      this.analytics.logGenerationEvent('generated', puzzle, {
        generationTime: genTime,
        validationTime: validTime,
        qualityScore: quality.overallScore,
      });

      const totalTime = Date.now() - startTime;

      return {
        puzzle,
        validationPassed: quality.passesStandards,
        metrics: {
          totalTime,
          generationTime: genTime,
          validationTime: validTime,
          qualityScore: quality.overallScore,
        },
      };
    } catch (error) {
      this.logger.error(`Generation pipeline failed: ${error.message}`);
      this.analytics.logGenerationEvent('failed', { id: 'error' } as any, {
        reason: 'pipeline_error',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate personalized puzzle
   */
  async generatePersonalizedPuzzle(
    userId: string,
    context: PersonalizationContext,
  ): Promise<GeneratedPuzzle> {
    const config = this.userPreferences.generatePersonalizedConfig(userId, context);
    const result = await this.generatePuzzle(config, userId);

    return result.puzzle;
  }

  /**
   * Batch generation
   */
  async generateBatch(
    config: {
      count: number;
      puzzleType: string;
      difficulty: string;
      parallel?: boolean;
    },
  ): Promise<GeneratedPuzzle[]> {
    const batchConfig = {
      count: config.count,
      puzzleType: config.puzzleType as any,
      difficulty: config.difficulty as any,
      parallel: config.parallel ?? true,
    };

    const result = await this.performanceOptimization.performBatchGeneration(batchConfig);
    return result.puzzles;
  }

  /**
   * Validate and debug puzzle generation
   */
  async debugGeneratePuzzle(config: GenerationConfig): Promise<GenerationDebugInfo> {
    const startTime = Date.now();
    const genStartTime = Date.now();

    // Generate
    const generationResult = await this.algorithms.generatePuzzle(config);
    const puzzle = generationResult.puzzle;
    const genTime = Date.now() - genStartTime;

    // Validate
    const validStartTime = Date.now();
    const validation = this.qualityAssessment.performComprehensiveValidation(puzzle);
    const validTime = Date.now() - validStartTime;

    // Assess quality
    const quality = this.qualityAssessment.assessQuality(puzzle);

    // Check uniqueness
    const uniqueness = this.varietyUniqueness.ensureUniqueness(puzzle);

    // Collect debug issues
    const issues: DebugIssue[] = [];

    if (!validation.passed) {
      issues.push({
        severity: 'error',
        message: 'Validation failed',
        context: validation,
      });
    }

    if (!quality.passesStandards) {
      quality.issues.forEach((issue) => {
        issues.push({
          severity: 'warning',
          message: issue,
        });
      });
    }

    if (!uniqueness.isUnique) {
      issues.push({
        severity: 'warning',
        message: `Not unique: ${uniqueness.similarPuzzles.length} similar puzzles found`,
        suggestion: 'Regenerate with different parameters or seed',
      });
    }

    const totalTime = Date.now() - startTime;

    return {
      config,
      generatedPuzzle: puzzle,
      validationSteps: validation.steps,
      issues,
      performanceMetrics: {
        generationTime: genTime,
        validationTime: validTime,
        totalTime,
        memoryUsed: 0,
      },
    };
  }

  /**
   * Generates system diagnostics
   */
  generateSystemDiagnostics(): {
    generation: any;
    performance: any;
    analytics: any;
    variety: any;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Performance diagnostics
    const perfStats = this.performanceOptimization.getPerformanceStats();
    const bottlenecks = this.performanceOptimization.analyzeBottlenecks();

    bottlenecks.forEach((bottleneck) => {
      recommendations.push(`[${bottleneck.severity}] ${bottleneck.recommendation}`);
    });

    // Variety diagnostics
    const uniqueStats = this.varietyUniqueness.getUniquenessStatistics();
    if (uniqueStats.duplicateRate > 0.2) {
      recommendations.push('High duplicate rate - reduce generation frequency or increase diversity');
    }

    // Analytics diagnostics
    const analytics = this.analytics.getAnalytics();
    if (analytics.successRate < 0.7) {
      recommendations.push('Low success rate - generation quality may be declining');
    }

    return {
      generation: {
        totalGenerated: analytics.totalGenerated,
        successRate: (analytics.successRate * 100).toFixed(2) + '%',
        avgQualityScore: analytics.averageQualityScore.toFixed(2),
      },
      performance: {
        cacheHitRate: (perfStats.cacheHitRate * 100).toFixed(2) + '%',
        avgGenerationTime: perfStats.avgGenerationTime.toFixed(2) + 'ms',
        memoryUsage: perfStats.memoryUsage.toFixed(2) + 'MB',
      },
      analytics,
      variety: uniqueStats,
      recommendations,
    };
  }

  /**
   * Exports full system state
   */
  exportSystemState(): string {
    const state = {
      timestamp: new Date().toISOString(),
      analytics: this.analytics.exportAnalytics(),
      performance: this.performanceOptimization.getPerformanceStats(),
      variety: this.varietyUniqueness.getUniquenessStatistics(),
      diagnostics: this.generateSystemDiagnostics(),
    };

    return JSON.stringify(state, null, 2);
  }

  /**
   * Resets system state
   */
  resetSystemState(): void {
    this.varietyUniqueness.resetVarietyTracking();
    this.performanceOptimization.clearCache();
    this.analytics.resetAnalytics();
    this.logger.log('System state reset');
  }
}
