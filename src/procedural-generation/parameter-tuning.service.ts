/**
 * Parameter Tuning and Optimization System
 * Handles generation parameter configuration and optimization
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AlgorithmParameter,
  AlgorithmConstraint,
  GenerationConfig,
  GeneratedPuzzle,
  GenerationAlgorithmConfig,
  DifficultyLevel,
} from './types';

interface ParameterTuningResult {
  originalParams: Record<string, any>;
  optimizedParams: Record<string, any>;
  improvementScore: number;
  metrics: {
    originalQuality: number;
    optimizedQuality: number;
    generationSpeed: number;
    solvabilityImprovement: number;
  };
}

interface ParameterOptimizationHistory {
  timestamp: Date;
  parameters: Record<string, any>;
  qualityScore: number;
  solvabilityScore: number;
  generationTime: number;
}

@Injectable()
export class ParameterTuningService {
  private readonly logger = new Logger(ParameterTuningService.name);

  private readonly algorithmConfigs: Map<string, GenerationAlgorithmConfig> = new Map();
  private readonly parameterHistory: ParameterOptimizationHistory[] = [];

  constructor() {
    this.initializeAlgorithmConfigs();
  }

  /**
   * Initialize default algorithm configurations
   */
  private initializeAlgorithmConfigs(): void {
    // Logic puzzle configuration
    this.algorithmConfigs.set('logic', {
      name: 'LogicPuzzleAlgorithm',
      version: '1.0.0',
      parameters: [
        {
          name: 'gridSize',
          type: 'number',
          default: 4,
          min: 2,
          max: 8,
          description: 'Size of the logic grid',
        },
        {
          name: 'constraintCount',
          type: 'number',
          default: 5,
          min: 2,
          max: 12,
          description: 'Number of constraints to apply',
        },
        {
          name: 'variableCount',
          type: 'number',
          default: 4,
          min: 2,
          max: 6,
          description: 'Number of variables in puzzle',
        },
        {
          name: 'solvabilityThreshold',
          type: 'number',
          default: 0.75,
          min: 0.5,
          max: 1.0,
          description: 'Minimum solvability score',
        },
      ],
      constraints: [
        {
          name: 'constraintGridMatch',
          condition: (config) => config.parameters?.constraintCount <= config.parameters?.gridSize * 3,
          message: 'Constraint count should not exceed grid size * 3',
        },
        {
          name: 'gridVariableMatch',
          condition: (config) => config.parameters?.gridSize === config.parameters?.variableCount,
          message: 'Grid size should match variable count for logic puzzles',
        },
      ],
    });

    // Pattern puzzle configuration
    this.algorithmConfigs.set('pattern', {
      name: 'PatternAlgorithm',
      version: '1.0.0',
      parameters: [
        {
          name: 'sequenceLength',
          type: 'number',
          default: 7,
          min: 5,
          max: 20,
          description: 'Length of the sequence',
        },
        {
          name: 'patternComplexity',
          type: 'number',
          default: 2,
          min: 1,
          max: 4,
          description: 'Pattern complexity level (layers of patterns)',
        },
        {
          name: 'missingCount',
          type: 'number',
          default: 2,
          min: 1,
          max: 5,
          description: 'Number of missing elements to identify',
        },
        {
          name: 'patternTypes',
          type: 'array',
          default: ['arithmetic', 'geometric', 'fibonacci'],
          description: 'Types of patterns to use',
        },
      ],
      constraints: [
        {
          name: 'missingCountLimit',
          condition: (config) => config.parameters?.missingCount < config.parameters?.sequenceLength,
          message: 'Missing count must be less than sequence length',
        },
      ],
    });

    // Math puzzle configuration
    this.algorithmConfigs.set('math', {
      name: 'MathExpressionAlgorithm',
      version: '1.0.0',
      parameters: [
        {
          name: 'operationCount',
          type: 'number',
          default: 2,
          min: 1,
          max: 4,
          description: 'Number of operations in expression',
        },
        {
          name: 'numberRange',
          type: 'number',
          default: 100,
          min: 10,
          max: 10000,
          description: 'Range for random numbers',
        },
        {
          name: 'allowedOperations',
          type: 'array',
          default: ['+', '-', '*'],
          description: 'Allowed mathematical operations',
        },
        {
          name: 'includeParentheses',
          type: 'boolean',
          default: false,
          description: 'Whether to include parentheses in expressions',
        },
      ],
      constraints: [
        {
          name: 'operationCountLimit',
          condition: (config) => config.parameters?.operationCount <= 4,
          message: 'Operation count should not exceed 4',
        },
      ],
    });

    // Word puzzle configuration
    this.algorithmConfigs.set('word', {
      name: 'WordPuzzleAlgorithm',
      version: '1.0.0',
      parameters: [
        {
          name: 'wordCount',
          type: 'number',
          default: 6,
          min: 3,
          max: 12,
          description: 'Number of words in puzzle',
        },
        {
          name: 'wordLength',
          type: 'number',
          default: 7,
          min: 4,
          max: 12,
          description: 'Average word length',
        },
        {
          name: 'wordDatabase',
          type: 'string',
          default: 'general',
          description: 'Word database to use',
        },
        {
          name: 'includeClues',
          type: 'boolean',
          default: true,
          description: 'Whether to include word clues',
        },
      ],
      constraints: [],
    });

    // Visual puzzle configuration
    this.algorithmConfigs.set('visual', {
      name: 'VisualPatternAlgorithm',
      version: '1.0.0',
      parameters: [
        {
          name: 'gridSize',
          type: 'number',
          default: 4,
          min: 3,
          max: 6,
          description: 'Size of visual grid',
        },
        {
          name: 'complexity',
          type: 'number',
          default: 3,
          min: 1,
          max: 5,
          description: 'Complexity of visual pattern',
        },
        {
          name: 'colorScheme',
          type: 'string',
          default: 'blackwhite',
          description: 'Color scheme for visual puzzle',
        },
      ],
      constraints: [],
    });
  }

  /**
   * Gets algorithm configuration
   */
  getAlgorithmConfig(puzzleType: string): GenerationAlgorithmConfig | null {
    return this.algorithmConfigs.get(puzzleType) || null;
  }

  /**
   * Validates parameters against algorithm constraints
   */
  validateParameters(
    puzzleType: string,
    parameters: Record<string, any>,
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const config = this.algorithmConfigs.get(puzzleType);
    if (!config) {
      return { valid: false, errors: [`Unknown puzzle type: ${puzzleType}`], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each parameter
    for (const paramDef of config.parameters) {
      const value = parameters[paramDef.name];

      if (value === undefined) {
        continue; // Use default
      }

      // Type validation
      if (typeof value !== paramDef.type && paramDef.type !== 'array') {
        errors.push(`Parameter ${paramDef.name} must be of type ${paramDef.type}`);
        continue;
      }

      // Range validation
      if (paramDef.type === 'number') {
        if (paramDef.min !== undefined && value < paramDef.min) {
          errors.push(`${paramDef.name} must be >= ${paramDef.min}`);
        }
        if (paramDef.max !== undefined && value > paramDef.max) {
          errors.push(`${paramDef.name} must be <= ${paramDef.max}`);
        }
      }
    }

    // Validate constraints
    for (const constraint of config.constraints) {
      if (
        !constraint.condition({
          difficulty: 'medium',
          puzzleType: puzzleType as any,
          parameters,
        })
      ) {
        errors.push(constraint.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Optimizes parameters for specific difficulty
   */
  optimizeForDifficulty(
    puzzleType: string,
    difficulty: DifficultyLevel,
  ): Record<string, any> {
    const config = this.algorithmConfigs.get(puzzleType);
    if (!config) {
      return {};
    }

    const optimized: Record<string, any> = {};

    const difficultyMultipliers = {
      easy: 0.6,
      medium: 1.0,
      hard: 1.5,
      expert: 2.0,
    };

    const multiplier = difficultyMultipliers[difficulty];

    for (const param of config.parameters) {
      if (param.type === 'number') {
        const adjusted = Math.round(param.default * multiplier);
        const clamped = Math.max(param.min || 0, Math.min(param.max || adjusted, adjusted));
        optimized[param.name] = clamped;
      } else if (param.type === 'boolean') {
        optimized[param.name] = param.default;
      } else if (param.type === 'array') {
        optimized[param.name] = param.default;
      } else {
        optimized[param.name] = param.default;
      }
    }

    return optimized;
  }

  /**
   * Performs parameter tuning based on generation results
   */
  async tuneParameters(
    puzzleType: string,
    currentParams: Record<string, any>,
    generatedPuzzles: GeneratedPuzzle[],
  ): Promise<ParameterTuningResult> {
    const config = this.algorithmConfigs.get(puzzleType);
    if (!config) {
      throw new Error(`Unknown puzzle type: ${puzzleType}`);
    }

    // Calculate metrics for current parameters
    const originalQuality = this.calculateAverageQuality(generatedPuzzles);
    const originalSolvability = this.calculateAverageSolvability(generatedPuzzles);

    // Generate candidate parameter sets
    const candidates = this.generateCandidateParameters(config, currentParams);

    // Simulate with each candidate (in real system, would regenerate)
    let bestParams = currentParams;
    let bestScore = originalQuality;

    for (const candidate of candidates) {
      const simulatedScore = this.simulateQuality(candidate, config);
      if (simulatedScore > bestScore) {
        bestScore = simulatedScore;
        bestParams = candidate;
      }
    }

    // Record in history
    this.parameterHistory.push({
      timestamp: new Date(),
      parameters: bestParams,
      qualityScore: bestScore,
      solvabilityScore: originalSolvability,
      generationTime: 0,
    });

    return {
      originalParams: currentParams,
      optimizedParams: bestParams,
      improvementScore: bestScore - originalQuality,
      metrics: {
        originalQuality,
        optimizedQuality: bestScore,
        generationSpeed: 0,
        solvabilityImprovement: 0,
      },
    };
  }

  /**
   * Generates candidate parameter sets for optimization
   */
  private generateCandidateParameters(
    config: GenerationAlgorithmConfig,
    baseParams: Record<string, any>,
  ): Record<string, any>[] {
    const candidates: Record<string, any>[] = [];

    for (const param of config.parameters) {
      if (param.type === 'number') {
        const base = baseParams[param.name] || param.default;
        const min = param.min || 1;
        const max = param.max || base * 2;

        // Create variations
        const variations = [base * 0.8, base * 0.9, base, base * 1.1, base * 1.2];

        for (const variation of variations) {
          const clamped = Math.max(min, Math.min(max, variation));
          const candidate = { ...baseParams };
          candidate[param.name] = Math.round(clamped);
          candidates.push(candidate);
        }
      }
    }

    return candidates.slice(0, 5); // Return top candidates
  }

  /**
   * Simulates quality for parameter set
   */
  private simulateQuality(params: Record<string, any>, config: GenerationAlgorithmConfig): number {
    // Simplified simulation based on parameter values
    let score = 0.5;

    for (const param of config.parameters) {
      if (param.type === 'number') {
        const value = params[param.name] || param.default;
        const min = param.min || 1;
        const max = param.max || value * 2;
        const normalized = (value - min) / (max - min);
        score += normalized * 0.1;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Calculates average quality of generated puzzles
   */
  private calculateAverageQuality(puzzles: GeneratedPuzzle[]): number {
    if (puzzles.length === 0) return 0.5;

    const totalQuality = puzzles.reduce((sum, p) => {
      const metrics = p.metadata.qualityMetrics;
      return (
        sum +
        (metrics.complexity +
          metrics.clarity +
          metrics.engagementPotential +
          metrics.solvability) /
          4
      );
    }, 0);

    return totalQuality / puzzles.length;
  }

  /**
   * Calculates average solvability
   */
  private calculateAverageSolvability(puzzles: GeneratedPuzzle[]): number {
    if (puzzles.length === 0) return 0.5;

    const totalSolvability = puzzles.reduce((sum, p) => sum + p.metadata.solvabilityScore, 0);

    return totalSolvability / puzzles.length;
  }

  /**
   * Gets optimization history
   */
  getOptimizationHistory(
    puzzleType?: string,
    limit: number = 100,
  ): ParameterOptimizationHistory[] {
    return this.parameterHistory.slice(-limit);
  }

  /**
   * Recommends parameter adjustments
   */
  recommendParameterAdjustments(
    puzzleType: string,
    issue: string,
  ): {
    adjustments: Record<string, any>;
    reasoning: string[];
  } {
    const config = this.algorithmConfigs.get(puzzleType);
    if (!config) {
      return { adjustments: {}, reasoning: [] };
    }

    const adjustments: Record<string, any> = {};
    const reasoning: string[] = [];

    if (issue.includes('too easy')) {
      for (const param of config.parameters) {
        if (param.name.includes('count') || param.name.includes('complexity')) {
          adjustments[param.name] = Math.round((param.default as number) * 1.3);
          reasoning.push(`Increased ${param.name} to raise difficulty`);
        }
      }
    }

    if (issue.includes('too hard')) {
      for (const param of config.parameters) {
        if (param.name.includes('count') || param.name.includes('complexity')) {
          adjustments[param.name] = Math.round((param.default as number) * 0.7);
          reasoning.push(`Decreased ${param.name} to lower difficulty`);
        }
      }
    }

    if (issue.includes('slow')) {
      for (const param of config.parameters) {
        if (param.name.includes('count')) {
          adjustments[param.name] = Math.round((param.default as number) * 0.8);
          reasoning.push(`Reduced ${param.name} to improve generation speed`);
        }
      }
    }

    if (issue.includes('not solvable')) {
      reasoning.push('Consider reducing complexity or adjusting constraints');
    }

    return { adjustments, reasoning };
  }

  /**
   * Exports parameters as JSON config
   */
  exportParameterConfig(
    puzzleType: string,
    params: Record<string, any>,
  ): string {
    const config: any = {
      puzzleType,
      version: '1.0.0',
      parameters: params,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * Imports parameters from JSON config
   */
  importParameterConfig(configJson: string): {
    puzzleType: string;
    parameters: Record<string, any>;
  } {
    const config = JSON.parse(configJson);
    const validation = this.validateParameters(config.puzzleType, config.parameters);

    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return {
      puzzleType: config.puzzleType,
      parameters: config.parameters,
    };
  }
}
