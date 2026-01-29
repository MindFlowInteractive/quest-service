/**
 * Difficulty-Aware Generation System
 * Handles constraint satisfaction and difficulty calibration
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GenerationConfig,
  GeneratedPuzzle,
  GenerationConstraints,
  DifficultyLevel,
  QualityMetrics,
} from './types';

interface ConstraintSatisfactionProblem {
  variables: string[];
  domains: Map<string, any[]>;
  constraints: Array<(assignment: Map<string, any>) => boolean>;
  metadata: {
    solvable: boolean;
    solutionCount: number;
    estimatedDifficulty: number;
  };
}

@Injectable()
export class DifficultyAwareGenerationService {
  private readonly logger = new Logger(DifficultyAwareGenerationService.name);

  /**
   * Validates and calibrates puzzle difficulty
   */
  async calibrateDifficulty(
    puzzle: GeneratedPuzzle,
    difficulty: DifficultyLevel,
  ): Promise<{ calibrated: GeneratedPuzzle; adjustmentFactor: number }> {
    const expectedComplexity = this.getExpectedComplexity(difficulty);
    const actualComplexity = this.calculateComplexity(puzzle);
    const adjustmentFactor = this.calculateAdjustment(actualComplexity, expectedComplexity);

    // Adjust difficulty rating if needed
    const calibrated = {
      ...puzzle,
      difficultyRating: Math.max(1, Math.min(10, puzzle.difficultyRating * adjustmentFactor)),
      metadata: {
        ...puzzle.metadata,
        qualityMetrics: {
          ...puzzle.metadata.qualityMetrics,
          complexity: actualComplexity,
        },
      },
    };

    return { calibrated, adjustmentFactor };
  }

  /**
   * Applies constraints to generation config
   */
  applyConstraints(
    config: GenerationConfig,
    constraints: GenerationConstraints,
  ): GenerationConfig {
    const adjusted = { ...config };

    if (constraints.minSolveTime || constraints.maxSolveTime) {
      adjusted.parameters = adjusted.parameters || {};
      adjusted.parameters.timeRange = {
        min: constraints.minSolveTime,
        max: constraints.maxSolveTime,
      };
    }

    if (constraints.requiredElements) {
      adjusted.parameters = adjusted.parameters || {};
      adjusted.parameters.requiredElements = constraints.requiredElements;
    }

    if (constraints.maxComplexity !== undefined) {
      adjusted.parameters = adjusted.parameters || {};
      adjusted.parameters.maxComplexity = constraints.maxComplexity;
    }

    return adjusted;
  }

  /**
   * Solves Constraint Satisfaction Problems
   */
  async solveCSP(csp: ConstraintSatisfactionProblem): Promise<Map<string, any> | null> {
    const assignment = new Map<string, any>();
    return this.backtrack(assignment, csp);
  }

  /**
   * Backtracking algorithm for CSP
   */
  private backtrack(
    assignment: Map<string, any>,
    csp: ConstraintSatisfactionProblem,
  ): Map<string, any> | null {
    if (assignment.size === csp.variables.length) {
      return assignment;
    }

    const variable = this.selectUnassignedVariable(assignment, csp);
    const domain = csp.domains.get(variable) || [];

    for (const value of domain) {
      assignment.set(variable, value);

      // Check if assignment is consistent
      if (this.isConsistent(assignment, csp)) {
        const result = this.backtrack(assignment, csp);
        if (result !== null) {
          return result;
        }
      }

      assignment.delete(variable);
    }

    return null;
  }

  /**
   * Selects next unassigned variable using MRV heuristic
   */
  private selectUnassignedVariable(
    assignment: Map<string, any>,
    csp: ConstraintSatisfactionProblem,
  ): string {
    let minRemainingValues = Infinity;
    let selectedVar = '';

    for (const variable of csp.variables) {
      if (!assignment.has(variable)) {
        const domain = csp.domains.get(variable) || [];
        const remainingValues = domain.length;

        if (remainingValues < minRemainingValues) {
          minRemainingValues = remainingValues;
          selectedVar = variable;
        }
      }
    }

    return selectedVar;
  }

  /**
   * Checks if current assignment is consistent
   */
  private isConsistent(assignment: Map<string, any>, csp: ConstraintSatisfactionProblem): boolean {
    for (const constraint of csp.constraints) {
      if (!constraint(assignment)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculates complexity score of a puzzle
   */
  private calculateComplexity(puzzle: GeneratedPuzzle): number {
    const metrics = puzzle.metadata.qualityMetrics;
    const baseComplexity = metrics.complexity;
    const estimatedTime = puzzle.estimatedSolveTime || 300;
    const timeComplexity = Math.min(1, estimatedTime / 900);

    // Weighted average
    return baseComplexity * 0.6 + timeComplexity * 0.4;
  }

  /**
   * Returns expected complexity for difficulty level
   */
  private getExpectedComplexity(difficulty: DifficultyLevel): number {
    const expected = {
      easy: 0.3,
      medium: 0.5,
      hard: 0.7,
      expert: 0.9,
    };
    return expected[difficulty];
  }

  /**
   * Calculates adjustment factor for difficulty calibration
   */
  private calculateAdjustment(actual: number, expected: number): number {
    const tolerance = 0.1;
    if (Math.abs(actual - expected) < tolerance) {
      return 1.0;
    }
    return Math.max(0.5, Math.min(1.5, expected / Math.max(actual, 0.1)));
  }

  /**
   * Validates puzzle meets difficulty requirements
   */
  validateDifficultyRequirements(
    puzzle: GeneratedPuzzle,
    difficulty: DifficultyLevel,
  ): { valid: boolean; score: number; issues: string[] } {
    const issues: string[] = [];
    const metrics = puzzle.metadata.qualityMetrics;

    // Check solvability
    if (puzzle.metadata.solvabilityScore < 0.7) {
      issues.push('Puzzle solvability score too low');
    }

    // Check complexity alignment
    const expectedComplexity = this.getExpectedComplexity(difficulty);
    const actual = this.calculateComplexity(puzzle);
    if (Math.abs(actual - expectedComplexity) > 0.15) {
      issues.push(`Complexity mismatch: expected ${expectedComplexity}, got ${actual}`);
    }

    // Check engagement
    if (metrics.engagementPotential < 0.6) {
      issues.push('Engagement potential too low');
    }

    // Check clarity
    if (metrics.clarity < 0.7) {
      issues.push('Puzzle clarity insufficient');
    }

    const score = Math.max(
      0,
      (1 - issues.length * 0.25) * (puzzle.metadata.solvabilityScore + actual) / 2,
    );

    return {
      valid: issues.length === 0 && score >= 0.7,
      score: Math.min(1, score),
      issues,
    };
  }

  /**
   * Generates adaptive difficulty parameters based on performance
   */
  generateAdaptiveDifficulty(
    playerSkillLevel: number, // 0-10
    recentSuccessRate: number, // 0-1
  ): DifficultyLevel {
    // If success rate is too high, increase difficulty
    if (recentSuccessRate > 0.8) {
      if (playerSkillLevel >= 8) return 'expert';
      if (playerSkillLevel >= 6) return 'hard';
      if (playerSkillLevel >= 4) return 'medium';
    }

    // If success rate is low, decrease difficulty
    if (recentSuccessRate < 0.4) {
      if (playerSkillLevel <= 2) return 'easy';
      if (playerSkillLevel <= 4) return 'easy';
      if (playerSkillLevel <= 6) return 'medium';
    }

    // Maintain current difficulty
    if (playerSkillLevel >= 8) return 'hard';
    if (playerSkillLevel >= 6) return 'medium';
    if (playerSkillLevel >= 4) return 'easy';
    return 'easy';
  }

  /**
   * Estimates solve time based on puzzle properties
   */
  estimateSolveTime(puzzle: GeneratedPuzzle): number {
    const complexity = puzzle.metadata.qualityMetrics.complexity;
    const baseTime = {
      logic: 300,
      pattern: 150,
      math: 120,
      word: 200,
      visual: 180,
    };

    const typeTime = baseTime[puzzle.type] || 200;
    const difficultyMultipliers = {
      easy: 0.7,
      medium: 1.0,
      hard: 1.5,
      expert: 2.0,
    };

    const diffMultiplier = difficultyMultipliers[puzzle.difficulty];
    const complexityFactor = 1 + complexity * 0.5;

    return Math.round(typeTime * diffMultiplier * complexityFactor);
  }

  /**
   * Validates puzzle solvability
   */
  async validateSolvability(puzzle: GeneratedPuzzle): Promise<{
    solvable: boolean;
    steps: number;
    difficulty: number;
  }> {
    try {
      const estimatedSteps = this.estimateSolutionSteps(puzzle);
      const isDifficultEnough = estimatedSteps >= 3;

      return {
        solvable: puzzle.metadata.solvabilityScore >= 0.8 && isDifficultEnough,
        steps: estimatedSteps,
        difficulty: puzzle.difficultyRating,
      };
    } catch (error) {
      this.logger.error(`Solvability validation failed: ${error.message}`);
      return {
        solvable: false,
        steps: 0,
        difficulty: puzzle.difficultyRating,
      };
    }
  }

  /**
   * Estimates number of steps needed to solve
   */
  private estimateSolutionSteps(puzzle: GeneratedPuzzle): number {
    const solution = puzzle.solution;
    return (solution.steps?.length || 1) + Math.ceil(puzzle.difficultyRating / 3);
  }

  /**
   * Generates difficulty progression curve
   */
  generateProgressionCurve(
    startDifficulty: DifficultyLevel,
    targetDifficulty: DifficultyLevel,
    puzzleCount: number,
  ): DifficultyLevel[] {
    const difficultyLevels: DifficultyLevel[] = ['easy', 'medium', 'hard', 'expert'];
    const startIdx = difficultyLevels.indexOf(startDifficulty);
    const targetIdx = difficultyLevels.indexOf(targetDifficulty);

    const curve: DifficultyLevel[] = [];
    const step = (targetIdx - startIdx) / (puzzleCount - 1);

    for (let i = 0; i < puzzleCount; i++) {
      const idx = Math.round(startIdx + step * i);
      curve.push(difficultyLevels[Math.max(0, Math.min(3, idx))]);
    }

    return curve;
  }
}
