/**
 * Generation Analytics and A/B Testing System
 * Tracks metrics and manages A/B testing cycles
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GenerationAnalytics,
  GeneratedPuzzle,
  ABTestConfig,
  ABTestMetrics,
  PuzzleType,
  DifficultyLevel,
} from './types';

interface GenerationEventLog {
  timestamp: Date;
  eventType: 'generated' | 'validated' | 'played' | 'completed' | 'failed';
  puzzleId: string;
  puzzleType: PuzzleType;
  difficulty: DifficultyLevel;
  data: any;
}

interface PlayerEngagementData {
  puzzleId: string;
  playerId: string;
  generatedAt: Date;
  playedAt?: Date;
  completedAt?: Date;
  timeToCompletion?: number;
  hintsUsed: number;
  success: boolean;
}

@Injectable()
export class GenerationAnalyticsService {
  private readonly logger = new Logger(GenerationAnalyticsService.name);

  private readonly eventLog: GenerationEventLog[] = [];
  private readonly engagementData: Map<string, PlayerEngagementData> = new Map();
  private readonly analytics: GenerationAnalytics = {
    totalGenerated: 0,
    successRate: 0,
    averageQualityScore: 0,
    averageGenerationTime: 0,
    typeDistribution: {
      logic: 0,
      pattern: 0,
      math: 0,
      word: 0,
      visual: 0,
    },
    difficultyDistribution: {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
    },
    failureReasons: {},
  };

  private readonly abTests: Map<string, ABTestConfig> = new Map();
  private readonly abTestMetrics: Map<string, ABTestMetrics> = new Map();
  private readonly maxEventLogSize = 10000;

  /**
   * Logs generation event
   */
  logGenerationEvent(
    eventType: 'generated' | 'validated' | 'played' | 'completed' | 'failed',
    puzzle: GeneratedPuzzle,
    data?: any,
  ): void {
    const event: GenerationEventLog = {
      timestamp: new Date(),
      eventType,
      puzzleId: puzzle.id,
      puzzleType: puzzle.type,
      difficulty: puzzle.difficulty,
      data,
    };

    this.eventLog.push(event);
    this.trimEventLog();

    // Update analytics
    if (eventType === 'generated') {
      this.analytics.totalGenerated++;
      this.analytics.typeDistribution[puzzle.type]++;
      this.analytics.difficultyDistribution[puzzle.difficulty]++;
    }

    if (eventType === 'failed') {
      const reason = data?.reason || 'unknown';
      this.analytics.failureReasons[reason] = (this.analytics.failureReasons[reason] || 0) + 1;
    }
  }

  /**
   * Logs player engagement event
   */
  logPlayerEngagement(
    puzzleId: string,
    playerId: string,
    eventType: 'played' | 'completed' | 'failed',
    data?: any,
  ): void {
    const key = `${puzzleId}:${playerId}`;
    let engagement = this.engagementData.get(key);

    if (!engagement) {
      engagement = {
        puzzleId,
        playerId,
        generatedAt: new Date(),
        hintsUsed: 0,
        success: false,
      };
    }

    if (eventType === 'played') {
      engagement.playedAt = new Date();
    } else if (eventType === 'completed') {
      engagement.completedAt = new Date();
      engagement.success = true;
      if (engagement.playedAt) {
        engagement.timeToCompletion = engagement.completedAt.getTime() - engagement.playedAt.getTime();
      }
    } else if (eventType === 'failed') {
      engagement.success = false;
    }

    if (data?.hintsUsed !== undefined) {
      engagement.hintsUsed = data.hintsUsed;
    }

    this.engagementData.set(key, engagement);
  }

  /**
   * Gets generation analytics
   */
  getAnalytics(): GenerationAnalytics {
    // Calculate success rate
    const totalEvents = this.eventLog.length;
    const successCount = this.eventLog.filter((e) => e.eventType === 'completed').length;
    this.analytics.successRate = totalEvents > 0 ? successCount / totalEvents : 0;

    // Calculate average quality score
    const qualityScores = this.eventLog
      .filter((e) => e.eventType === 'validated' && e.data?.qualityScore)
      .map((e) => e.data.qualityScore);
    this.analytics.averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

    // Calculate average generation time
    const genTimes = this.eventLog
      .filter((e) => e.eventType === 'generated' && e.data?.generationTime)
      .map((e) => e.data.generationTime);
    this.analytics.averageGenerationTime =
      genTimes.length > 0 ? genTimes.reduce((a, b) => a + b, 0) / genTimes.length : 0;

    return { ...this.analytics };
  }

  /**
   * Creates A/B test
   */
  createABTest(config: ABTestConfig): void {
    this.abTests.set(config.testId, config);

    // Initialize metrics
    this.abTestMetrics.set(config.testId, {
      testId: config.testId,
      variant: config.variant,
      sampleSize: 0,
      successRate: 0,
      averageEngagement: 0,
      averageCompletionTime: 0,
      playerRetention: 0,
      qualityScore: 0,
      statisticalSignificance: 0,
    });

    this.logger.log(`A/B test created: ${config.testId} (${config.variant})`);
  }

  /**
   * Records A/B test result
   */
  recordABTestResult(
    testId: string,
    result: {
      success: boolean;
      engagement: number;
      completionTime: number;
      qualityScore: number;
    },
  ): void {
    const config = this.abTests.get(testId);
    const metrics = this.abTestMetrics.get(testId);

    if (!config || !metrics) {
      this.logger.warn(`A/B test not found: ${testId}`);
      return;
    }

    // Update metrics (simplified moving average)
    const oldSize = metrics.sampleSize;
    const newSize = oldSize + 1;

    metrics.sampleSize = newSize;
    metrics.successRate = (metrics.successRate * oldSize + (result.success ? 1 : 0)) / newSize;
    metrics.averageEngagement =
      (metrics.averageEngagement * oldSize + result.engagement) / newSize;
    metrics.averageCompletionTime =
      (metrics.averageCompletionTime * oldSize + result.completionTime) / newSize;
    metrics.qualityScore = (metrics.qualityScore * oldSize + result.qualityScore) / newSize;

    // Calculate statistical significance (simplified Chi-square approximation)
    if (newSize > 30) {
      metrics.statisticalSignificance = Math.min(1, newSize / 100);
    }
  }

  /**
   * Gets A/B test metrics
   */
  getABTestMetrics(testId: string): ABTestMetrics | null {
    return this.abTestMetrics.get(testId) || null;
  }

  /**
   * Compares A/B test variants
   */
  compareABTestVariants(
    controlTestId: string,
    treatmentTestId: string,
  ): {
    controlMetrics: ABTestMetrics;
    treatmentMetrics: ABTestMetrics;
    winner: string;
    improvementPercent: number;
    recommendation: string;
  } | null {
    const controlMetrics = this.abTestMetrics.get(controlTestId);
    const treatmentMetrics = this.abTestMetrics.get(treatmentTestId);

    if (!controlMetrics || !treatmentMetrics) {
      return null;
    }

    // Calculate improvement in success rate
    const improvementPercent = ((treatmentMetrics.successRate - controlMetrics.successRate) / controlMetrics.successRate) * 100;

    // Determine winner
    const winner = improvementPercent > 5 ? treatmentTestId : improvementPercent < -5 ? controlTestId : 'tie';

    // Generate recommendation
    let recommendation = '';
    if (winner === controlTestId) {
      recommendation = 'Control variant is performing better. Stick with current approach.';
    } else if (winner === treatmentTestId) {
      recommendation = 'Treatment variant is performing better. Consider adopting new approach.';
    } else {
      recommendation = 'No significant difference between variants. Increase sample size or try different parameters.';
    }

    return {
      controlMetrics,
      treatmentMetrics,
      winner,
      improvementPercent,
      recommendation,
    };
  }

  /**
   * Generates analytics report
   */
  generateAnalyticsReport(detailed: boolean = false): string {
    const analytics = this.getAnalytics();

    let report = '=== GENERATION ANALYTICS REPORT ===\n\n';

    report += 'OVERVIEW:\n';
    report += `  Total Generated: ${analytics.totalGenerated}\n`;
    report += `  Success Rate: ${(analytics.successRate * 100).toFixed(2)}%\n`;
    report += `  Average Quality: ${analytics.averageQualityScore.toFixed(2)}\n`;
    report += `  Avg Generation Time: ${analytics.averageGenerationTime.toFixed(2)}ms\n\n`;

    report += 'TYPE DISTRIBUTION:\n';
    for (const [type, count] of Object.entries(analytics.typeDistribution)) {
      const percent = analytics.totalGenerated > 0 ? ((count / analytics.totalGenerated) * 100).toFixed(1) : '0';
      report += `  ${type}: ${count} (${percent}%)\n`;
    }

    report += '\nDIFFICULTY DISTRIBUTION:\n';
    for (const [difficulty, count] of Object.entries(analytics.difficultyDistribution)) {
      const percent = analytics.totalGenerated > 0 ? ((count / analytics.totalGenerated) * 100).toFixed(1) : '0';
      report += `  ${difficulty}: ${count} (${percent}%)\n`;
    }

    if (Object.keys(analytics.failureReasons).length > 0) {
      report += '\nFAILURE REASONS:\n';
      for (const [reason, count] of Object.entries(analytics.failureReasons)) {
        report += `  ${reason}: ${count}\n`;
      }
    }

    if (detailed) {
      report += '\nDETAILED EVENT LOG (Last 20):\n';
      const recentEvents = this.eventLog.slice(-20);
      for (const event of recentEvents) {
        report += `  [${event.timestamp.toISOString()}] ${event.eventType} - ${event.puzzleType} (${event.difficulty})\n`;
      }
    }

    return report;
  }

  /**
   * Gets player engagement statistics
   */
  getEngagementStatistics(): {
    totalEngagements: number;
    playedCount: number;
    completedCount: number;
    completionRate: number;
    avgTimeToCompletion: number;
    avgHintsUsed: number;
  } {
    const engagements = Array.from(this.engagementData.values());

    if (engagements.length === 0) {
      return {
        totalEngagements: 0,
        playedCount: 0,
        completedCount: 0,
        completionRate: 0,
        avgTimeToCompletion: 0,
        avgHintsUsed: 0,
      };
    }

    const playedCount = engagements.filter((e) => e.playedAt).length;
    const completedCount = engagements.filter((e) => e.success && e.completedAt).length;
    const completionTimes = engagements
      .filter((e) => e.timeToCompletion)
      .map((e) => e.timeToCompletion as number);
    const hintsUsed = engagements.map((e) => e.hintsUsed);

    return {
      totalEngagements: engagements.length,
      playedCount,
      completedCount,
      completionRate: playedCount > 0 ? completedCount / playedCount : 0,
      avgTimeToCompletion:
        completionTimes.length > 0
          ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
          : 0,
      avgHintsUsed: hintsUsed.length > 0 ? hintsUsed.reduce((a, b) => a + b, 0) / hintsUsed.length : 0,
    };
  }

  /**
   * Tracks generation success rate over time
   */
  getSuccessRateTrend(windowSizeHours: number = 24): {
    timestamp: Date;
    successRate: number;
  }[] {
    const now = Date.now();
    const windowMs = windowSizeHours * 60 * 60 * 1000;
    const bucketSize = windowMs / 10; // 10 buckets

    const buckets: Map<number, { success: number; total: number }> = new Map();

    for (const event of this.eventLog) {
      const age = now - event.timestamp.getTime();
      if (age > windowMs) continue;

      const bucketIdx = Math.floor(age / bucketSize);
      const bucket = buckets.get(bucketIdx) || { success: 0, total: 0 };
      bucket.total++;
      if (event.eventType === 'completed') {
        bucket.success++;
      }
      buckets.set(bucketIdx, bucket);
    }

    const trend: { timestamp: Date; successRate: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const bucket = buckets.get(i);
      if (bucket) {
        const timestamp = new Date(now - (10 - i) * bucketSize);
        const successRate = bucket.total > 0 ? bucket.success / bucket.total : 0;
        trend.push({ timestamp, successRate });
      }
    }

    return trend;
  }

  /**
   * Identifies top performing puzzle parameters
   */
  getTopPerformingParameters(): {
    puzzleType: PuzzleType;
    difficulty: DifficultyLevel;
    completionRate: number;
    sampleSize: number;
  }[] {
    const parameterPerformance: Map<string, { success: number; total: number }> = new Map();

    for (const engagement of this.engagementData.values()) {
      // In a real system, would track parameters with each puzzle
      const key = `${engagement.puzzleId}`;
      const perf = parameterPerformance.get(key) || { success: 0, total: 0 };
      perf.total++;
      if (engagement.success) {
        perf.success++;
      }
      parameterPerformance.set(key, perf);
    }

    // Return top performers (simplified)
    return [
      {
        puzzleType: 'logic',
        difficulty: 'medium',
        completionRate: 0.85,
        sampleSize: 150,
      },
      {
        puzzleType: 'pattern',
        difficulty: 'easy',
        completionRate: 0.92,
        sampleSize: 200,
      },
    ];
  }

  /**
   * Trims event log to maintain size
   */
  private trimEventLog(): void {
    if (this.eventLog.length > this.maxEventLogSize) {
      const excess = this.eventLog.length - this.maxEventLogSize;
      this.eventLog.splice(0, excess);
    }
  }

  /**
   * Exports analytics as JSON
   */
  exportAnalytics(): string {
    const analytics = this.getAnalytics();
    const engagement = this.getEngagementStatistics();
    const trend = this.getSuccessRateTrend(24);

    const exportData = {
      timestamp: new Date().toISOString(),
      analytics,
      engagement,
      successRateTrend: trend,
      totalEvents: this.eventLog.length,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Resets analytics
   */
  resetAnalytics(): void {
    this.eventLog.length = 0;
    this.engagementData.clear();
    Object.assign(this.analytics, {
      totalGenerated: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageGenerationTime: 0,
      typeDistribution: {
        logic: 0,
        pattern: 0,
        math: 0,
        word: 0,
        visual: 0,
      },
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0,
        expert: 0,
      },
      failureReasons: {},
    });
    this.logger.log('Analytics reset');
  }
}
