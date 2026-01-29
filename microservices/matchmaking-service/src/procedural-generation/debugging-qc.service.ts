/**
 * Generation Debugging and Quality Control Tools
 * Admin tools for monitoring and debugging generation system
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  GeneratedPuzzle,
  GenerationDebugInfo,
  ValidationStep,
  DebugIssue,
} from './types';

interface QCReport {
  timestamp: Date;
  totalChecked: number;
  passedCount: number;
  failedCount: number;
  issues: QCIssue[];
  recommendations: string[];
}

interface QCIssue {
  puzzleId: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  suggestedFix?: string;
}

interface GenerationLog {
  id: string;
  timestamp: Date;
  config: any;
  result: 'success' | 'failed';
  duration: number;
  qualityScore?: number;
  issues?: string[];
}

@Injectable()
export class GenerationDebuggingQCService {
  private readonly logger = new Logger(GenerationDebuggingQCService.name);

  private readonly generationLogs: GenerationLog[] = [];
  private readonly qcReports: QCReport[] = [];
  private readonly debugCache: Map<string, GenerationDebugInfo> = new Map();
  private readonly maxLogSize = 5000;

  /**
   * Logs generation event for debugging
   */
  logGenerationEvent(
    id: string,
    config: any,
    result: 'success' | 'failed',
    duration: number,
    qualityScore?: number,
    issues?: string[],
  ): void {
    const log: GenerationLog = {
      id,
      timestamp: new Date(),
      config,
      result,
      duration,
      qualityScore,
      issues,
    };

    this.generationLogs.push(log);
    this.trimLogs();
  }

  /**
   * Stores debug information
   */
  storeDebugInfo(debugInfo: GenerationDebugInfo): void {
    const key = debugInfo.generatedPuzzle.id;
    this.debugCache.set(key, debugInfo);

    // Keep only recent debug info
    if (this.debugCache.size > 100) {
      const keys = Array.from(this.debugCache.keys());
      this.debugCache.delete(keys[0]);
    }
  }

  /**
   * Retrieves debug information for a puzzle
   */
  getDebugInfo(puzzleId: string): GenerationDebugInfo | null {
    return this.debugCache.get(puzzleId) || null;
  }

  /**
   * Performs quality control on batch of puzzles
   */
  performQualityControl(
    puzzles: GeneratedPuzzle[],
  ): QCReport {
    const report: QCReport = {
      timestamp: new Date(),
      totalChecked: puzzles.length,
      passedCount: 0,
      failedCount: 0,
      issues: [],
      recommendations: [],
    };

    for (const puzzle of puzzles) {
      const qcIssues = this.checkPuzzleQuality(puzzle);

      if (qcIssues.length === 0) {
        report.passedCount++;
      } else {
        report.failedCount++;
        report.issues.push(...qcIssues);
      }
    }

    // Generate recommendations
    if (report.failedCount / report.totalChecked > 0.2) {
      report.recommendations.push('High failure rate - review generation parameters');
    }

    const criticalCount = report.issues.filter((i) => i.severity === 'critical').length;
    if (criticalCount > 0) {
      report.recommendations.push(`${criticalCount} critical issues found - immediate action required`);
    }

    this.qcReports.push(report);

    return report;
  }

  /**
   * Checks individual puzzle quality
   */
  private checkPuzzleQuality(puzzle: GeneratedPuzzle): QCIssue[] {
    const issues: QCIssue[] = [];

    // Structure checks
    if (!puzzle.id || puzzle.id.length === 0) {
      issues.push({
        puzzleId: puzzle.id || 'unknown',
        severity: 'critical',
        category: 'structure',
        message: 'Missing puzzle ID',
      });
    }

    if (!puzzle.title || puzzle.title.length < 5) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'content',
        message: 'Title too short',
        suggestedFix: 'Use descriptive titles of at least 5 characters',
      });
    }

    if (!puzzle.description) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'content',
        message: 'Missing description',
        suggestedFix: 'Add a clear description of the puzzle',
      });
    }

    // Content checks
    if (!puzzle.content || !puzzle.content.puzzle) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'critical',
        category: 'content',
        message: 'Missing puzzle content',
      });
    }

    if (!puzzle.solution || !puzzle.solution.answer) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'critical',
        category: 'content',
        message: 'Missing solution',
      });
    }

    if (!puzzle.solution?.explanation) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'content',
        message: 'Missing solution explanation',
        suggestedFix: 'Provide explanation for learning',
      });
    }

    // Hints checks
    if (!puzzle.hints || puzzle.hints.length === 0) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'hints',
        message: 'No hints provided',
        suggestedFix: 'Add 2-3 helpful hints',
      });
    } else if (puzzle.hints.length > 10) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'info',
        category: 'hints',
        message: 'Many hints provided',
        suggestedFix: 'Consider reducing to 3-5 most helpful hints',
      });
    }

    // Quality metrics checks
    const metrics = puzzle.metadata.qualityMetrics;
    if (metrics.solvability < 0.7) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'critical',
        category: 'quality',
        message: `Low solvability score: ${metrics.solvability.toFixed(2)}`,
        suggestedFix: 'Simplify constraints or add more clues',
      });
    }

    if (metrics.clarity < 0.7) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'quality',
        message: `Low clarity score: ${metrics.clarity.toFixed(2)}`,
        suggestedFix: 'Improve instructions and puzzle description',
      });
    }

    if (metrics.engagementPotential < 0.6) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'info',
        category: 'quality',
        message: `Low engagement potential: ${metrics.engagementPotential.toFixed(2)}`,
        suggestedFix: 'Make puzzle more interesting or novel',
      });
    }

    // Difficulty checks
    if (puzzle.difficultyRating < 1 || puzzle.difficultyRating > 10) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'difficulty',
        message: `Invalid difficulty rating: ${puzzle.difficultyRating}`,
        suggestedFix: 'Difficulty rating should be 1-10',
      });
    }

    // Time limit checks
    if (puzzle.timeLimit < 30) {
      issues.push({
        puzzleId: puzzle.id,
        severity: 'warning',
        category: 'difficulty',
        message: 'Time limit too short (< 30 seconds)',
        suggestedFix: 'Increase time limit based on puzzle complexity',
      });
    }

    return issues;
  }

  /**
   * Generates detailed debug report
   */
  generateDebugReport(puzzleId?: string): string {
    let report = '=== GENERATION DEBUG REPORT ===\n\n';

    if (puzzleId) {
      const debugInfo = this.getDebugInfo(puzzleId);
      if (debugInfo) {
        report += this.formatDebugInfo(debugInfo);
      } else {
        report += `No debug information found for puzzle: ${puzzleId}\n`;
      }
    } else {
      report += 'RECENT GENERATION LOGS:\n\n';
      const recent = this.generationLogs.slice(-20);

      for (const log of recent) {
        report += `[${log.timestamp.toISOString()}] ${log.id}\n`;
        report += `  Result: ${log.result}\n`;
        report += `  Duration: ${log.duration}ms\n`;
        if (log.qualityScore !== undefined) {
          report += `  Quality: ${log.qualityScore.toFixed(2)}\n`;
        }
        if (log.issues && log.issues.length > 0) {
          report += `  Issues: ${log.issues.join(', ')}\n`;
        }
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Formats debug info into readable report
   */
  private formatDebugInfo(debugInfo: GenerationDebugInfo): string {
    let report = `PUZZLE: ${debugInfo.generatedPuzzle.id}\n`;
    report += `TYPE: ${debugInfo.generatedPuzzle.type}\n`;
    report += `DIFFICULTY: ${debugInfo.generatedPuzzle.difficulty}\n\n`;

    report += 'VALIDATION STEPS:\n';
    for (const step of debugInfo.validationSteps) {
      const status = step.passed ? '✓' : '✗';
      report += `  ${status} ${step.name} (${step.duration}ms)\n`;
      if (!step.passed) {
        report += `    Message: ${step.message}\n`;
      }
    }

    if (debugInfo.issues.length > 0) {
      report += '\nISSUES:\n';
      for (const issue of debugInfo.issues) {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
        report += `  ${icon} [${issue.severity}] ${issue.message}\n`;
        if (issue.suggestion) {
          report += `    Suggestion: ${issue.suggestion}\n`;
        }
      }
    }

    report += '\nPERFORMANCE:\n';
    report += `  Generation: ${debugInfo.performanceMetrics.generationTime}ms\n`;
    report += `  Validation: ${debugInfo.performanceMetrics.validationTime}ms\n`;
    report += `  Total: ${debugInfo.performanceMetrics.totalTime}ms\n`;

    return report;
  }

  /**
   * Generates QC summary report
   */
  generateQCSummary(): string {
    if (this.qcReports.length === 0) {
      return 'No QC reports available';
    }

    const latest = this.qcReports[this.qcReports.length - 1];

    let report = '=== QUALITY CONTROL SUMMARY ===\n\n';
    report += `Last Check: ${latest.timestamp.toISOString()}\n`;
    report += `Total Checked: ${latest.totalChecked}\n`;
    report += `Passed: ${latest.passedCount} (${((latest.passedCount / latest.totalChecked) * 100).toFixed(1)}%)\n`;
    report += `Failed: ${latest.failedCount} (${((latest.failedCount / latest.totalChecked) * 100).toFixed(1)}%)\n\n`;

    if (latest.issues.length > 0) {
      report += 'ISSUES BY SEVERITY:\n';
      const bySeverity = this.groupBySeverity(latest.issues);

      for (const [severity, issues] of Object.entries(bySeverity)) {
        report += `  ${severity.toUpperCase()}: ${(issues as any[]).length}\n`;
      }

      report += '\nISSUES BY CATEGORY:\n';
      const byCategory = this.groupByCategory(latest.issues);

      for (const [category, issues] of Object.entries(byCategory)) {
        report += `  ${category}: ${(issues as any[]).length}\n`;
      }
    }

    if (latest.recommendations.length > 0) {
      report += '\nRECOMMENDATIONS:\n';
      for (const rec of latest.recommendations) {
        report += `  → ${rec}\n`;
      }
    }

    return report;
  }

  /**
   * Groups issues by severity
   */
  private groupBySeverity(issues: QCIssue[]): Record<string, QCIssue[]> {
    return issues.reduce(
      (acc, issue) => {
        if (!acc[issue.severity]) {
          acc[issue.severity] = [];
        }
        acc[issue.severity].push(issue);
        return acc;
      },
      {} as Record<string, QCIssue[]>,
    );
  }

  /**
   * Groups issues by category
   */
  private groupByCategory(issues: QCIssue[]): Record<string, QCIssue[]> {
    return issues.reduce(
      (acc, issue) => {
        if (!acc[issue.category]) {
          acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
      },
      {} as Record<string, QCIssue[]>,
    );
  }

  /**
   * Gets generation success metrics
   */
  getGenerationMetrics(): {
    totalLogged: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgDuration: number;
    avgQuality: number;
  } {
    if (this.generationLogs.length === 0) {
      return {
        totalLogged: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        avgDuration: 0,
        avgQuality: 0,
      };
    }

    const successCount = this.generationLogs.filter((l) => l.result === 'success').length;
    const failureCount = this.generationLogs.filter((l) => l.result === 'failed').length;

    const durations = this.generationLogs.map((l) => l.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    const qualityScores = this.generationLogs
      .filter((l) => l.qualityScore !== undefined)
      .map((l) => l.qualityScore as number);
    const avgQuality =
      qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;

    return {
      totalLogged: this.generationLogs.length,
      successCount,
      failureCount,
      successRate: successCount / this.generationLogs.length,
      avgDuration,
      avgQuality,
    };
  }

  /**
   * Exports all debug data
   */
  exportDebugData(): string {
    const metrics = this.getGenerationMetrics();
    const latestQC = this.qcReports[this.qcReports.length - 1] || null;

    const exportData = {
      timestamp: new Date().toISOString(),
      metrics,
      latestQCReport: latestQC,
      recentLogs: this.generationLogs.slice(-100),
      debugCacheSize: this.debugCache.size,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clears all debug data
   */
  clearDebugData(): void {
    this.generationLogs.length = 0;
    this.qcReports.length = 0;
    this.debugCache.clear();
    this.logger.log('Debug data cleared');
  }

  /**
   * Trims logs to maintain size limit
   */
  private trimLogs(): void {
    if (this.generationLogs.length > this.maxLogSize) {
      const excess = this.generationLogs.length - this.maxLogSize;
      this.generationLogs.splice(0, excess);
    }
  }
}
