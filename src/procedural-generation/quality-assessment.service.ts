/**
 * Generation Quality Assessment System
 * Validates and measures generated puzzle quality
 */

import { Injectable, Logger } from '@nestjs/common';
import { GeneratedPuzzle, QualityMetrics, ValidationStep, DebugIssue, PerformanceMetrics } from './types';

interface QualityThresholds {
  minSolvability: number;
  minClarity: number;
  minEngagement: number;
  minUniqueness: number;
  minComplexity: number;
  maxComplexity: number;
}

@Injectable()
export class GenerationQualityAssessmentService {
  private readonly logger = new Logger(GenerationQualityAssessmentService.name);

  private readonly qualityThresholds: QualityThresholds = {
    minSolvability: 0.75,
    minClarity: 0.7,
    minEngagement: 0.65,
    minUniqueness: 0.4,
    minComplexity: 0.15,
    maxComplexity: 0.95,
  };

  /**
   * Comprehensive quality assessment
   */
  assessQuality(puzzle: GeneratedPuzzle): {
    overallScore: number;
    metricsBreakdown: QualityMetrics;
    issues: string[];
    recommendations: string[];
    passesStandards: boolean;
  } {
    const metrics = puzzle.metadata.qualityMetrics;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check each metric against thresholds
    if (puzzle.metadata.solvabilityScore < this.qualityThresholds.minSolvability) {
      issues.push(`Solvability ${puzzle.metadata.solvabilityScore.toFixed(2)} below threshold`);
      recommendations.push('Simplify puzzle constraints or add more hint options');
    }

    if (metrics.clarity < this.qualityThresholds.minClarity) {
      issues.push(`Clarity ${metrics.clarity.toFixed(2)} below threshold`);
      recommendations.push('Improve puzzle description and make instructions clearer');
    }

    if (metrics.engagementPotential < this.qualityThresholds.minEngagement) {
      issues.push(`Engagement ${metrics.engagementPotential.toFixed(2)} below threshold`);
      recommendations.push('Add more interesting puzzle variations or twists');
    }

    if (metrics.complexity < this.qualityThresholds.minComplexity) {
      issues.push(`Complexity ${metrics.complexity.toFixed(2)} below threshold`);
      recommendations.push('Increase puzzle difficulty or add more constraints');
    }

    if (metrics.complexity > this.qualityThresholds.maxComplexity) {
      issues.push(`Complexity ${metrics.complexity.toFixed(2)} exceeds maximum`);
      recommendations.push('Reduce puzzle constraints or simplify the problem space');
    }

    // Calculate overall score
    const overallScore =
      (puzzle.metadata.solvabilityScore +
        metrics.clarity +
        metrics.engagementPotential +
        metrics.complexity) /
      4;

    const passesStandards = issues.length === 0 && overallScore >= 0.75;

    return {
      overallScore: Math.min(1, overallScore),
      metricsBreakdown: metrics,
      issues,
      recommendations,
      passesStandards,
    };
  }

  /**
   * Validates puzzle for player engagement
   */
  validateEngagement(puzzle: GeneratedPuzzle): {
    engagementScore: number;
    factors: {
      clarity: number;
      novelty: number;
      challenge: number;
      feedback: number;
    };
    issues: string[];
  } {
    const metrics = puzzle.metadata.qualityMetrics;

    // Check clarity
    const clarity = metrics.clarity;
    if (clarity < 0.6) {
      return {
        engagementScore: 0,
        factors: { clarity: 0, novelty: 0, challenge: 0, feedback: 0 },
        issues: ['Puzzle instructions are unclear - players will be confused'],
      };
    }

    // Check novelty
    const novelty = Math.min(1, metrics.uniqueness + 0.2);

    // Check challenge appropriateness
    const challenge = metrics.complexity;
    const challenges: string[] = [];
    if (challenge < 0.2) {
      challenges.push('Puzzle too easy - may not engage players');
    }
    if (challenge > 0.85) {
      challenges.push('Puzzle too difficult - may frustrate players');
    }

    // Feedback quality (based on hints)
    const feedback = puzzle.hints?.length > 0 ? 0.8 : 0.5;

    const engagementScore = (clarity * 0.4 + novelty * 0.25 + challenge * 0.25 + feedback * 0.1);

    return {
      engagementScore: Math.min(1, engagementScore),
      factors: { clarity, novelty, challenge, feedback },
      issues: challenges,
    };
  }

  /**
   * Validates puzzle educational value
   */
  validateEducationalValue(puzzle: GeneratedPuzzle): {
    score: number;
    skillsDeveloped: string[];
    learningOutcomes: string[];
    issues: string[];
  } {
    const skillsMap = {
      logic: ['Logical reasoning', 'Critical thinking', 'Problem decomposition'],
      pattern: ['Pattern recognition', 'Analytical thinking', 'Inductive reasoning'],
      math: ['Mathematical thinking', 'Calculation', 'Numerical reasoning'],
      word: ['Linguistic skills', 'Vocabulary', 'Language comprehension'],
      visual: ['Spatial reasoning', 'Visual analysis', 'Pattern matching'],
    };

    const skillsDeveloped = skillsMap[puzzle.type] || [];
    const learningOutcomes = [
      `Understanding ${puzzle.type} challenges`,
      `Developing systematic problem-solving approach`,
      `Building confidence in puzzle solving`,
    ];

    const issues: string[] = [];
    if (!puzzle.solution?.explanation) {
      issues.push('No solution explanation for learning');
    }
    if (!puzzle.hints || puzzle.hints.length === 0) {
      issues.push('No hints for guided learning');
    }

    const score = Math.max(0, 0.8 - issues.length * 0.2);

    return {
      score,
      skillsDeveloped,
      learningOutcomes,
      issues,
    };
  }

  /**
   * Performs comprehensive validation
   */
  performComprehensiveValidation(
    puzzle: GeneratedPuzzle,
  ): {
    steps: ValidationStep[];
    passed: boolean;
    totalScore: number;
    detailedReport: string;
  } {
    const startTime = Date.now();
    const steps: ValidationStep[] = [];

    // Step 1: Structure validation
    const structureCheck = this.validateStructure(puzzle);
    steps.push({
      name: 'Structure Validation',
      passed: structureCheck.valid,
      message: structureCheck.errors.join('; ') || 'Valid puzzle structure',
      duration: Date.now() - startTime,
    });

    // Step 2: Content validation
    const contentCheck = this.validateContent(puzzle);
    steps.push({
      name: 'Content Validation',
      passed: contentCheck.valid,
      message: contentCheck.errors.join('; ') || 'Valid content',
      duration: Date.now() - startTime,
    });

    // Step 3: Solvability validation
    const solvabilityCheck = this.validateSolvability(puzzle);
    steps.push({
      name: 'Solvability Validation',
      passed: solvabilityCheck.valid,
      message: `Solvability score: ${solvabilityCheck.score.toFixed(2)}`,
      duration: Date.now() - startTime,
    });

    // Step 4: Quality validation
    const qualityCheck = this.assessQuality(puzzle);
    steps.push({
      name: 'Quality Assessment',
      passed: qualityCheck.passesStandards,
      message: `Overall score: ${qualityCheck.overallScore.toFixed(2)}`,
      duration: Date.now() - startTime,
    });

    // Step 5: Engagement validation
    const engagementCheck = this.validateEngagement(puzzle);
    steps.push({
      name: 'Engagement Validation',
      passed: engagementCheck.engagementScore >= 0.6,
      message: `Engagement score: ${engagementCheck.engagementScore.toFixed(2)}`,
      duration: Date.now() - startTime,
    });

    // Step 6: Educational value validation
    const educationalCheck = this.validateEducationalValue(puzzle);
    steps.push({
      name: 'Educational Value',
      passed: educationalCheck.score >= 0.6,
      message: `Educational score: ${educationalCheck.score.toFixed(2)}`,
      duration: Date.now() - startTime,
    });

    const totalScore = steps.reduce((sum, step) => sum + (step.passed ? 1 : 0), 0) / steps.length;
    const passed = steps.every((step) => step.passed);

    const detailedReport = this.generateValidationReport(steps, qualityCheck, engagementCheck);

    return { steps, passed, totalScore, detailedReport };
  }

  /**
   * Validates puzzle structure
   */
  private validateStructure(puzzle: GeneratedPuzzle): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!puzzle.id) errors.push('Missing puzzle ID');
    if (!puzzle.type) errors.push('Missing puzzle type');
    if (!puzzle.difficulty) errors.push('Missing difficulty level');
    if (!puzzle.title || puzzle.title.length < 5) errors.push('Title too short or missing');
    if (!puzzle.description) errors.push('Missing description');
    if (!puzzle.content) errors.push('Missing puzzle content');
    if (!puzzle.solution) errors.push('Missing solution');
    if (!puzzle.solution?.answer) errors.push('Solution answer missing');
    if (!puzzle.hints || puzzle.hints.length === 0) errors.push('No hints provided');
    if (puzzle.timeLimit <= 0) errors.push('Invalid time limit');
    if (puzzle.basePoints <= 0) errors.push('Invalid point value');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates puzzle content
   */
  private validateContent(puzzle: GeneratedPuzzle): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!puzzle.content.puzzle) {
      errors.push('Puzzle content is empty');
    }

    if (puzzle.hints?.length > 0) {
      const invalidHints = puzzle.hints.filter((h) => typeof h !== 'string' || h.length < 5);
      if (invalidHints.length > 0) {
        errors.push(`${invalidHints.length} invalid hints detected`);
      }
    }

    if (!puzzle.solution?.explanation || puzzle.solution.explanation.length < 10) {
      errors.push('Solution explanation insufficient');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates puzzle solvability
   */
  private validateSolvability(puzzle: GeneratedPuzzle): {
    valid: boolean;
    score: number;
  } {
    const score = puzzle.metadata.solvabilityScore;
    return {
      valid: score >= 0.7,
      score,
    };
  }

  /**
   * Generates comprehensive validation report
   */
  private generateValidationReport(
    steps: ValidationStep[],
    qualityCheck: any,
    engagementCheck: any,
  ): string {
    let report = '=== PUZZLE VALIDATION REPORT ===\n\n';

    report += 'VALIDATION STEPS:\n';
    steps.forEach((step) => {
      report += `  ✓ ${step.name}: ${step.passed ? 'PASSED' : 'FAILED'} (${step.duration}ms)\n`;
      if (step.message) {
        report += `    → ${step.message}\n`;
      }
    });

    report += '\nQUALITY METRICS:\n';
    report += `  Overall Score: ${qualityCheck.overallScore.toFixed(2)}\n`;
    report += `  Passes Standards: ${qualityCheck.passesStandards ? 'YES' : 'NO'}\n`;

    if (qualityCheck.issues.length > 0) {
      report += '\nISSUES FOUND:\n';
      qualityCheck.issues.forEach((issue) => {
        report += `  ⚠ ${issue}\n`;
      });
    }

    if (qualityCheck.recommendations.length > 0) {
      report += '\nRECOMMENDATIONS:\n';
      qualityCheck.recommendations.forEach((rec) => {
        report += `  → ${rec}\n`;
      });
    }

    report += '\nENGAGEMENT ANALYSIS:\n';
    report += `  Engagement Score: ${engagementCheck.engagementScore.toFixed(2)}\n`;
    report += `  Clarity: ${engagementCheck.factors.clarity.toFixed(2)}\n`;
    report += `  Novelty: ${engagementCheck.factors.novelty.toFixed(2)}\n`;
    report += `  Challenge: ${engagementCheck.factors.challenge.toFixed(2)}\n`;

    return report;
  }

  /**
   * Calculates plagiarism score (simplified version)
   */
  calculateUniquenessScore(
    puzzle: GeneratedPuzzle,
    recentPuzzles: GeneratedPuzzle[],
  ): { uniqueness: number; similarCount: number } {
    let similarCount = 0;

    for (const recentPuzzle of recentPuzzles) {
      const similarity = this.calculateSimilarity(puzzle, recentPuzzle);
      if (similarity > 0.8) {
        similarCount++;
      }
    }

    const uniqueness = Math.max(0, 1 - similarCount / Math.max(1, recentPuzzles.length) * 0.5);

    return { uniqueness, similarCount };
  }

  /**
   * Calculates similarity between two puzzles
   */
  private calculateSimilarity(puzzle1: GeneratedPuzzle, puzzle2: GeneratedPuzzle): number {
    let score = 0;
    let factors = 0;

    // Type similarity
    if (puzzle1.type === puzzle2.type) {
      score += 0.3;
    }
    factors += 0.3;

    // Difficulty similarity
    if (puzzle1.difficulty === puzzle2.difficulty) {
      score += 0.2;
    }
    factors += 0.2;

    // Content similarity (simplified)
    const content1 = JSON.stringify(puzzle1.content).substring(0, 50);
    const content2 = JSON.stringify(puzzle2.content).substring(0, 50);
    if (content1 === content2) {
      score += 0.5;
    }
    factors += 0.5;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Generates debug report
   */
  generateDebugReport(
    puzzle: GeneratedPuzzle,
    validationSteps: ValidationStep[],
    issues: DebugIssue[],
    performanceMetrics: PerformanceMetrics,
  ): string {
    let report = '=== GENERATION DEBUG REPORT ===\n\n';

    report += 'PUZZLE INFO:\n';
    report += `  ID: ${puzzle.id}\n`;
    report += `  Type: ${puzzle.type}\n`;
    report += `  Difficulty: ${puzzle.difficulty} (${puzzle.difficultyRating}/10)\n`;
    report += `  Validation Score: ${puzzle.validationScore.toFixed(2)}\n\n`;

    report += 'VALIDATION STEPS:\n';
    validationSteps.forEach((step) => {
      report += `  ${step.passed ? '✓' : '✗'} ${step.name} (${step.duration}ms)\n`;
      if (!step.passed) {
        report += `    Message: ${step.message}\n`;
      }
    });

    if (issues.length > 0) {
      report += '\nDETECTED ISSUES:\n';
      issues.forEach((issue) => {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
        report += `  ${icon} [${issue.severity.toUpperCase()}] ${issue.message}\n`;
        if (issue.suggestion) {
          report += `    → Suggestion: ${issue.suggestion}\n`;
        }
      });
    }

    report += '\nPERFORMANCE METRICS:\n';
    report += `  Generation Time: ${performanceMetrics.generationTime}ms\n`;
    report += `  Validation Time: ${performanceMetrics.validationTime}ms\n`;
    report += `  Total Time: ${performanceMetrics.totalTime}ms\n`;
    report += `  Memory Used: ${performanceMetrics.memoryUsed}MB\n`;

    return report;
  }
}
