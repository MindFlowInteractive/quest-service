import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PuzzleMove } from '../../game-engine/types/puzzle.types';
import { ViolationType, Severity } from '../constants';
import type { AntiCheatConfig } from '../config/anti-cheat.config';

export interface DetectionResult {
  isAnomaly: boolean;
  violations: DetectionViolation[];
  metrics: Record<string, any>;
}

export interface DetectionViolation {
  type: ViolationType;
  severity: Severity;
  confidenceScore: number;
  evidence: {
    detectionMethod: string;
    metrics: Record<string, any>;
    anomalies: Array<{
      type: string;
      severity: string;
      description: string;
      value?: any;
    }>;
  };
}

/**
 * Service responsible for detecting cheating patterns and anomalies
 * Implements detection algorithms for speed, timing, and behavioral analysis
 */
@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);
  private readonly config: AntiCheatConfig['thresholds'];

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<AntiCheatConfig['thresholds']>('antiCheat.thresholds')!;
  }

  /**
   * Detect impossibly fast move sequences
   * Flags if >80% of moves are under human reaction time
   */
  detectSpeedAnomalies(moves: PuzzleMove[]): DetectionResult {
    if (moves.length < 3) {
      return { isAnomaly: false, violations: [], metrics: {} };
    }

    const timings: number[] = [];
    for (let i = 1; i < moves.length; i++) {
      const timeDiff = new Date(moves[i].timestamp).getTime() - new Date(moves[i - 1].timestamp).getTime();
      if (timeDiff > 0) {
        timings.push(timeDiff);
      }
    }

    if (timings.length === 0) {
      return { isAnomaly: false, violations: [], metrics: {} };
    }

    const fastMoves = timings.filter(t => t < this.config.impossiblyFastThreshold).length;
    const fastMoveRatio = fastMoves / timings.length;

    const violations: DetectionViolation[] = [];

    // Check for impossibly fast moves
    if (fastMoveRatio > this.config.maxFastMoveRatio) {
      violations.push({
        type: ViolationType.IMPOSSIBLY_FAST_COMPLETION,
        severity: Severity.HIGH,
        confidenceScore: Math.min(95, 50 + (fastMoveRatio * 50)),
        evidence: {
          detectionMethod: 'speed_analysis',
          metrics: {
            totalMoves: moves.length,
            fastMoves,
            fastMoveRatio,
            avgTimeBetweenMoves: timings.reduce((a, b) => a + b, 0) / timings.length,
            threshold: this.config.impossiblyFastThreshold
          },
          anomalies: [{
            type: 'IMPOSSIBLY_FAST_MOVES',
            severity: 'HIGH',
            description: `${(fastMoveRatio * 100).toFixed(1)}% of moves are under ${this.config.impossiblyFastThreshold}ms`,
            value: fastMoveRatio
          }]
        }
      });
    }

    // Check for robotic consistency (low variance)
    const variance = this.calculateVariance(timings);
    const stdDev = Math.sqrt(variance);

    if (stdDev < this.config.roboticConsistencyThreshold && timings.length >= 10) {
      violations.push({
        type: ViolationType.ROBOTIC_TIMING,
        severity: Severity.MEDIUM,
        confidenceScore: Math.min(85, 40 + ((this.config.roboticConsistencyThreshold - stdDev) * 1.5)),
        evidence: {
          detectionMethod: 'timing_variance_analysis',
          metrics: {
            totalMoves: moves.length,
            stdDev,
            variance,
            avgTimeBetweenMoves: timings.reduce((a, b) => a + b, 0) / timings.length,
            threshold: this.config.roboticConsistencyThreshold
          },
          anomalies: [{
            type: 'ROBOTIC_TIMING',
            severity: 'MEDIUM',
            description: `Move timing has suspiciously low variance (σ=${stdDev.toFixed(2)}ms)`,
            value: stdDev
          }]
        }
      });
    }

    return {
      isAnomaly: violations.length > 0,
      violations,
      metrics: {
        totalMoves: moves.length,
        fastMoves,
        fastMoveRatio,
        stdDev,
        avgTime: timings.reduce((a, b) => a + b, 0) / timings.length
      }
    };
  }

  /**
   * Detect perfect accuracy patterns that indicate automated solving
   */
  detectPerfectAccuracy(
    moves: PuzzleMove[],
    allValid: boolean,
    isFirstAttempt: boolean
  ): DetectionResult {
    if (moves.length < this.config.perfectAccuracyMinMoves) {
      return { isAnomaly: false, violations: [], metrics: {} };
    }

    const violations: DetectionViolation[] = [];

    if (allValid && isFirstAttempt) {
      const accuracy = 1.0;
      if (accuracy >= this.config.suspiciousAccuracyThreshold) {
        violations.push({
          type: ViolationType.PERFECT_ACCURACY,
          severity: Severity.HIGH,
          confidenceScore: 80,
          evidence: {
            detectionMethod: 'accuracy_analysis',
            metrics: {
              totalMoves: moves.length,
              validMoves: moves.length,
              accuracy,
              isFirstAttempt,
              threshold: this.config.suspiciousAccuracyThreshold
            },
            anomalies: [{
              type: 'PERFECT_ACCURACY',
              severity: 'HIGH',
              description: `Perfect accuracy (${(accuracy * 100)}%) on first attempt with ${moves.length} moves`,
              value: accuracy
            }]
          }
        });
      }
    }

    return {
      isAnomaly: violations.length > 0,
      violations,
      metrics: { totalMoves: moves.length, allValid, isFirstAttempt }
    };
  }

  /**
   * Detect optimal solution paths that indicate solver usage
   */
  detectOptimalPath(
    moves: PuzzleMove[],
    optimalMoveCount: number,
    isFirstAttempt: boolean
  ): DetectionResult {
    if (!optimalMoveCount || optimalMoveCount === 0) {
      return { isAnomaly: false, violations: [], metrics: {} };
    }

    const efficiency = optimalMoveCount / moves.length;
    const violations: DetectionViolation[] = [];

    // First-time solvers rarely achieve >95% efficiency
    if (efficiency > 0.95 && isFirstAttempt) {
      violations.push({
        type: ViolationType.AUTOMATED_SOLVER,
        severity: Severity.HIGH,
        confidenceScore: Math.min(90, 60 + (efficiency * 30)),
        evidence: {
          detectionMethod: 'solution_path_analysis',
          metrics: {
            actualMoves: moves.length,
            optimalMoves: optimalMoveCount,
            efficiency,
            isFirstAttempt,
            threshold: 0.95
          },
          anomalies: [{
            type: 'OPTIMAL_PATH',
            severity: 'HIGH',
            description: `Near-optimal solution path (${(efficiency * 100).toFixed(1)}% efficiency) on first attempt`,
            value: efficiency
          }]
        }
      });
    }

    return {
      isAnomaly: violations.length > 0,
      violations,
      metrics: { actualMoves: moves.length, optimalMoves: optimalMoveCount, efficiency }
    };
  }

  /**
   * Check if moves show human-like exploration patterns
   * Humans typically make mistakes and backtrack
   */
  detectLackOfExploration(moves: PuzzleMove[]): DetectionResult {
    if (moves.length < 20) {
      return { isAnomaly: false, violations: [], metrics: {} };
    }

    // Check for backtracking or corrective moves
    // This is a simplified check - in a real implementation, we'd analyze move patterns
    const hasBacktracking = moves.some((move: any, idx: number) => {
      if (idx === 0) return false;
      // Check if this move reverses or corrects the previous move
      // This would require puzzle-specific logic
      return false;
    });

    const violations: DetectionViolation[] = [];

    if (!hasBacktracking && moves.length > 20) {
      violations.push({
        type: ViolationType.AUTOMATED_SOLVER,
        severity: Severity.MEDIUM,
        confidenceScore: 65,
        evidence: {
          detectionMethod: 'exploration_pattern_analysis',
          metrics: {
            totalMoves: moves.length,
            hasBacktracking,
            explorationScore: 0
          },
          anomalies: [{
            type: 'NO_EXPLORATION',
            severity: 'MEDIUM',
            description: 'Perfect solution path with no exploration or backtracking',
            value: 0
          }]
        }
      });
    }

    return {
      isAnomaly: violations.length > 0,
      violations,
      metrics: { hasBacktracking, moveCount: moves.length }
    };
  }

  /**
   * Analyze a sequence of moves for multiple anomaly patterns
   */
  analyzeMoveSequence(
    moves: PuzzleMove[],
    context: {
      isFirstAttempt: boolean;
      optimalMoveCount?: number;
      allMovesValid: boolean;
    }
  ): DetectionResult {
    const results: DetectionResult[] = [
      this.detectSpeedAnomalies(moves),
      this.detectPerfectAccuracy(moves, context.allMovesValid, context.isFirstAttempt),
      this.detectOptimalPath(moves, context.optimalMoveCount || 0, context.isFirstAttempt),
      this.detectLackOfExploration(moves)
    ];

    const allViolations = results.flatMap(r => r.violations);
    const allMetrics = results.reduce((acc, r) => ({ ...acc, ...r.metrics }), {});

    return {
      isAnomaly: allViolations.length > 0,
      violations: allViolations,
      metrics: allMetrics
    };
  }

  /**
   * Calculate statistical variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate z-score for a value given population statistics
   */
  calculateZScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }
}
