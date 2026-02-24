import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleReplay } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import { ReplayComparisonDto } from '../dto/replay-playback.dto';

/**
 * Service for comparing two puzzle replays
 * Analyzes differences and provides learning insights
 */
@Injectable()
export class ReplayComparisonService {
  constructor(
    @InjectRepository(PuzzleReplay)
    private readonly replayRepo: Repository<PuzzleReplay>,
    @InjectRepository(ReplayAction)
    private readonly actionRepo: Repository<ReplayAction>,
  ) {}

  /**
   * Compare two replays to identify improvements
   */
  async compareReplays(
    originalReplayId: string,
    newReplayId: string,
  ): Promise<ReplayComparisonDto> {
    const [originalReplay, newReplay] = await Promise.all([
      this.replayRepo.findOne({ where: { id: originalReplayId } }),
      this.replayRepo.findOne({ where: { id: newReplayId } }),
    ]);

    if (!originalReplay) {
      throw new NotFoundException(`Original replay ${originalReplayId} not found`);
    }

    if (!newReplay) {
      throw new NotFoundException(`New replay ${newReplayId} not found`);
    }

    // Fetch all actions for both replays
    const [originalActions, newActions] = await Promise.all([
      this.actionRepo.find({
        where: { replayId: originalReplayId },
        order: { sequenceNumber: 'ASC' },
      }),
      this.actionRepo.find({
        where: { replayId: newReplayId },
        order: { sequenceNumber: 'ASC' },
      }),
    ]);

    // Calculate differences
    const actionDifferences = this.compareActionSequences(
      originalActions,
      newActions,
    );
    const timingComparison = this.compareTimings(originalReplay, newReplay);
    const performanceComparison = this.comparePerformance(
      originalReplay,
      newReplay,
    );
    const learningMetrics = this.calculateLearningMetrics(
      originalReplay,
      newReplay,
      actionDifferences,
    );

    return {
      originalReplayId,
      newReplayId,
      actionDifferences,
      timingComparison,
      performanceComparison,
      learningMetrics,
    };
  }

  /**
   * Compare action sequences using a simple diff algorithm
   */
  private compareActionSequences(
    originalActions: ReplayAction[],
    newActions: ReplayAction[],
  ): ReplayComparisonDto['actionDifferences'] {
    const differenceDetails: ReplayComparisonDto['actionDifferences']['differenceDetails'] =
      [];

    // Simple diff: find longest common subsequence
    const lcs = this.longestCommonSubsequence(originalActions, newActions);

    // Mark differences
    let origIdx = 0;
    let newIdx = 0;

    for (const commonSeq of lcs) {
      // Actions before common sequence
      while (origIdx < commonSeq.origIdx) {
        differenceDetails.push({
          sequenceNumber: origIdx,
          changeType: 'removed',
          originalAction: {
            type: originalActions[origIdx].actionType,
            data: originalActions[origIdx].actionData,
          },
        });
        origIdx++;
      }

      while (newIdx < commonSeq.newIdx) {
        differenceDetails.push({
          sequenceNumber: newIdx,
          changeType: 'inserted',
          newAction: {
            type: newActions[newIdx].actionType,
            data: newActions[newIdx].actionData,
          },
        });
        newIdx++;
      }

      // Check if actions are different even if both exist
      if (
        originalActions[origIdx] &&
        newActions[newIdx] &&
        !this.areActionsEqual(originalActions[origIdx], newActions[newIdx])
      ) {
        differenceDetails.push({
          sequenceNumber: origIdx,
          changeType: 'modified',
          originalAction: {
            type: originalActions[origIdx].actionType,
            data: originalActions[origIdx].actionData,
          },
          newAction: {
            type: newActions[newIdx].actionType,
            data: newActions[newIdx].actionData,
          },
        });
      }

      origIdx++;
      newIdx++;
    }

    // Remaining actions
    while (origIdx < originalActions.length) {
      differenceDetails.push({
        sequenceNumber: origIdx,
        changeType: 'removed',
        originalAction: {
          type: originalActions[origIdx].actionType,
          data: originalActions[origIdx].actionData,
        },
      });
      origIdx++;
    }

    while (newIdx < newActions.length) {
      differenceDetails.push({
        sequenceNumber: newIdx,
        changeType: 'inserted',
        newAction: {
          type: newActions[newIdx].actionType,
          data: newActions[newIdx].actionData,
        },
      });
      newIdx++;
    }

    const insertedCount = differenceDetails.filter((d) => d.changeType === 'inserted').length;
    const removedCount = differenceDetails.filter((d) => d.changeType === 'removed').length;
    const modifiedCount = differenceDetails.filter((d) => d.changeType === 'modified').length;

    return {
      totalDifferenceCount: differenceDetails.length,
      insertedActions: insertedCount,
      removedActions: removedCount,
      modifiedActions: modifiedCount,
      differenceDetails,
    };
  }

  /**
   * Compare timing information between replays
   */
  private compareTimings(
    originalReplay: PuzzleReplay,
    newReplay: PuzzleReplay,
  ): ReplayComparisonDto['timingComparison'] {
    const originalDuration = originalReplay.totalDuration || 0;
    const newDuration = newReplay.totalDuration || 0;
    const timeSavings = originalDuration - newDuration;
    const timeSavingsPercentage =
      originalDuration > 0 ? (timeSavings / originalDuration) * 100 : 0;

    return {
      originalDuration,
      newDuration,
      timeSavings,
      timeSavingsPercentage: Math.round(timeSavingsPercentage * 100) / 100,
    };
  }

  /**
   * Compare performance metrics
   */
  private comparePerformance(
    originalReplay: PuzzleReplay,
    newReplay: PuzzleReplay,
  ): ReplayComparisonDto['performanceComparison'] {
    const originalScore = originalReplay.scoreEarned || 0;
    const newScore = newReplay.scoreEarned || 0;
    const scoreImprovement = newScore - originalScore;
    const scoreImprovementPercentage =
      originalScore > 0 ? (scoreImprovement / originalScore) * 100 : 0;

    const hintsReduction = originalReplay.hintsUsed - newReplay.hintsUsed;

    const originalEfficiency = originalReplay.efficiency || 0;
    const newEfficiency = newReplay.efficiency || 0;
    const efficiencyGain = newEfficiency - originalEfficiency;

    return {
      originalScore,
      newScore,
      scoreImprovement,
      scoreImprovementPercentage: Math.round(scoreImprovementPercentage * 100) / 100,
      hintsReduction,
      efficiencyGain: Math.round(efficiencyGain * 100) / 100,
    };
  }

  /**
   * Calculate learning metrics from comparison
   */
  private calculateLearningMetrics(
    originalReplay: PuzzleReplay,
    newReplay: PuzzleReplay,
    actionDifferences: ReplayComparisonDto['actionDifferences'],
  ): ReplayComparisonDto['learningMetrics'] {
    // Optimization level (0-100): based on score improvement and efficiency
    const scoreImprovement =
      originalReplay.scoreEarned && newReplay.scoreEarned
        ? ((newReplay.scoreEarned - originalReplay.scoreEarned) /
            originalReplay.scoreEarned) *
          100
        : 0;
    const efficiencyImprovement = (newReplay.efficiency || 0) - (originalReplay.efficiency || 0);
    const optimizationLevel = Math.min(
      100,
      Math.max(0, (scoreImprovement + efficiencyImprovement) / 2),
    );

    // Strategy improvement: fewer total actions is better
    const actionReduction =
      originalReplay.movesCount - newReplay.movesCount > 0 &&
      originalReplay.movesCount > 0;

    // Mistakes reduced: fewer undos and better efficiency
    const mistakesReduced = newReplay.undosCount < originalReplay.undosCount;

    // Calculate average move duration
    const originalAvgMoveDuration =
      originalReplay.totalDuration / Math.max(1, originalReplay.movesCount);
    const newAvgMoveDuration =
      newReplay.totalDuration / Math.max(1, newReplay.movesCount);
    const moveDurationChange = newAvgMoveDuration - originalAvgMoveDuration;

    return {
      optimizationLevel: Math.round(optimizationLevel * 100) / 100,
      strategyImprovement: actionReduction,
      mistakesReduced,
      averageMoveDuration: {
        original: Math.round(originalAvgMoveDuration),
        new: Math.round(newAvgMoveDuration),
        change: Math.round(moveDurationChange),
      },
    };
  }

  /**
   * Check if two actions are functionally equal
   */
  private areActionsEqual(action1: ReplayAction, action2: ReplayAction): boolean {
    return (
      action1.actionType === action2.actionType &&
      JSON.stringify(action1.actionData) === JSON.stringify(action2.actionData)
    );
  }

  /**
   * Find longest common subsequence between two action arrays
   * Simple O(n*m) implementation for practical replay sizes
   */
  private longestCommonSubsequence(
    original: ReplayAction[],
    updated: ReplayAction[],
  ): Array<{ origIdx: number; newIdx: number }> {
    const m = original.length;
    const n = updated.length;

    // DP table
    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (this.areActionsEqual(original[i - 1], updated[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    const lcs: Array<{ origIdx: number; newIdx: number }> = [];
    let i = m,
      j = n;

    while (i > 0 && j > 0) {
      if (this.areActionsEqual(original[i - 1], updated[j - 1])) {
        lcs.unshift({ origIdx: i - 1, newIdx: j - 1 });
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  /**
   * Get statistical summary of comparison
   */
  async getComparisonSummary(
    originalReplayId: string,
    newReplayId: string,
  ): Promise<{
    improved: boolean;
    improvementAreas: string[];
    areasForImprovement: string[];
  }> {
    const comparison = await this.compareReplays(originalReplayId, newReplayId);

    const improvementAreas: string[] = [];
    const areasForImprovement: string[] = [];

    // Check various improvement indicators
    if (comparison.performanceComparison.scoreImprovement > 0) {
      improvementAreas.push('Score increased');
    } else {
      areasForImprovement.push('Score decreased');
    }

    if (comparison.performanceComparison.hintsReduction > 0) {
      improvementAreas.push('Required fewer hints');
    }

    if (comparison.timingComparison.timeSavings > 0) {
      improvementAreas.push('Solved faster');
    } else {
      areasForImprovement.push('Took longer to solve');
    }

    if (comparison.learningMetrics.mistakesReduced) {
      improvementAreas.push('Made fewer mistakes');
    } else {
      areasForImprovement.push('More mistakes made');
    }

    const improved =
      comparison.learningMetrics.optimizationLevel > 0 &&
      improvementAreas.length > areasForImprovement.length;

    return {
      improved,
      improvementAreas,
      areasForImprovement,
    };
  }
}
