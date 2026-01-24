import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Replay } from '../entities/replay.entity';
import { Action, ActionType } from '../entities/action.entity';

export interface ReplayAnalytics {
  replayId: string;
  totalActions: number;
  totalDuration: number;
  averageActionInterval: number;
  actionBreakdown: Record<ActionType, number>;
  hints: {
    count: number;
    percentage: number;
  };
  undoRedoRatio: number;
  efficiency: number; // Actions to complete ratio
  difficulty: string;
  playerSkillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  keyInsights: string[];
  performanceMetrics: {
    avgTimePerAction: number;
    peakActivityPeriod: string;
    consistencyScore: number; // 0-100
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Replay)
    private replayRepository: Repository<Replay>,
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
  ) {}

  /**
   * Generate comprehensive analytics for a replay
   */
  async generateAnalytics(replayId: string): Promise<ReplayAnalytics> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
      relations: ['actions'],
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    // Fetch all actions if not loaded
    let actions = replay.actions;
    if (!actions || actions.length === 0) {
      actions = await this.actionRepository.find({
        where: { replayId },
        order: { sequence: 'ASC' },
      });
    }

    // Calculate basic metrics
    const totalActions = actions.length;
    const totalDuration = this.calculateTotalDuration(actions);
    const actionBreakdown = this.breakdownActionTypes(actions);
    const hintsCount = actionBreakdown[ActionType.HINT_USED] || 0;
    const undoCount = actionBreakdown[ActionType.UNDO] || 0;
    const redoCount = actionBreakdown[ActionType.REDO] || 0;

    // Calculate advanced metrics
    const averageActionInterval = this.calculateAverageInterval(actions);
    const averageTimePerAction = totalDuration / Math.max(totalActions, 1);
    const undoRedoRatio = undoCount + redoCount > 0 ? (undoCount + redoCount) / totalActions : 0;
    const efficiency = this.calculateEfficiency(replay, totalActions, undoCount, redoCount);
    const consistencyScore = this.calculateConsistency(actions);
    const peakActivityPeriod = this.findPeakActivityPeriod(actions);

    // Determine difficulty and skill level
    const difficultyLevel = replay.metadata?.difficulty || 'unknown';
    const playerSkillLevel = this.assessPlayerSkillLevel(
      efficiency,
      undoRedoRatio,
      consistencyScore,
      hintsCount,
      totalActions,
    );

    // Generate insights
    const insights = this.generateKeyInsights(
      replay,
      actions,
      efficiency,
      undoRedoRatio,
      playerSkillLevel,
      hintsCount,
      totalActions,
    );

    return {
      replayId,
      totalActions,
      totalDuration,
      averageActionInterval,
      actionBreakdown,
      hints: {
        count: hintsCount,
        percentage: totalActions > 0 ? Math.round((hintsCount / totalActions) * 100) : 0,
      },
      undoRedoRatio: Math.round(undoRedoRatio * 100),
      efficiency: Math.round(efficiency * 100),
      difficulty: difficultyLevel,
      playerSkillLevel,
      keyInsights: insights,
      performanceMetrics: {
        avgTimePerAction: averageTimePerAction,
        peakActivityPeriod,
        consistencyScore,
      },
    };
  }

  /**
   * Get action type breakdown
   */
  private breakdownActionTypes(actions: Action[]): Record<ActionType, number> {
    const breakdown: Record<ActionType, number> = {} as any;

    for (const actionType of Object.values(ActionType)) {
      breakdown[actionType] = 0;
    }

    actions.forEach((action) => {
      breakdown[action.type] = (breakdown[action.type] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Calculate total duration from actions
   */
  private calculateTotalDuration(actions: Action[]): number {
    if (actions.length === 0) return 0;
    const lastAction = actions[actions.length - 1];
    return lastAction.relativeTime;
  }

  /**
   * Calculate average time between actions
   */
  private calculateAverageInterval(actions: Action[]): number {
    if (actions.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < actions.length; i++) {
      totalInterval += actions[i].relativeTime - actions[i - 1].relativeTime;
    }

    return totalInterval / (actions.length - 1);
  }

  /**
   * Calculate efficiency score (lower undo/redo = higher efficiency)
   */
  private calculateEfficiency(
    replay: Replay,
    totalActions: number,
    undoCount: number,
    redoCount: number,
  ): number {
    // Base efficiency: completed puzzles are more efficient
    const completionBonus = replay.metadata?.completed ? 1.0 : 0.7;

    // Penalty for undo/redo actions
    const undoRedoPenalty = Math.max(0, 1 - (undoCount + redoCount) / Math.max(totalActions, 1));

    return completionBonus * undoRedoPenalty;
  }

  /**
   * Calculate consistency score based on action timing variance
   */
  private calculateConsistency(actions: Action[]): number {
    if (actions.length < 2) return 100;

    const intervals: number[] = [];
    for (let i = 1; i < actions.length; i++) {
      intervals.push(actions[i].relativeTime - actions[i - 1].relativeTime);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Convert to 0-100 score (lower variance = higher consistency)
    const consistencyScore = Math.max(0, 100 - Math.min(100, (stdDev / mean) * 100));

    return Math.round(consistencyScore);
  }

  /**
   * Find the period with most activity
   */
  private findPeakActivityPeriod(actions: Action[]): string {
    if (actions.length === 0) return 'unknown';

    const totalDuration = actions[actions.length - 1]?.relativeTime || 0;
    const periodDuration = totalDuration / 4; // Divide into 4 periods

    const periods = ['start', 'mid-early', 'mid-late', 'end'];
    let maxCount = 0;
    let peakPeriod = 'start';

    periods.forEach((period, idx) => {
      const periodStart = idx * periodDuration;
      const periodEnd = (idx + 1) * periodDuration;

      const count = actions.filter(
        (a) => a.relativeTime >= periodStart && a.relativeTime <= periodEnd,
      ).length;

      if (count > maxCount) {
        maxCount = count;
        peakPeriod = period;
      }
    });

    return peakPeriod;
  }

  /**
   * Assess player skill level based on performance metrics
   */
  private assessPlayerSkillLevel(
    efficiency: number,
    undoRedoRatio: number,
    consistency: number,
    hintsCount: number,
    totalActions: number,
  ): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    const hintRatio = totalActions > 0 ? hintsCount / totalActions : 0;
    const score = efficiency * 0.4 + (1 - undoRedoRatio) * 0.3 + (consistency / 100) * 0.2 + (1 - Math.min(hintRatio, 1)) * 0.1;

    if (score > 0.85) {
      return 'expert';
    } else if (score > 0.65) {
      return 'advanced';
    } else if (score > 0.45) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  /**
   * Generate human-readable insights
   */
  private generateKeyInsights(
    replay: Replay,
    actions: Action[],
    efficiency: number,
    undoRedoRatio: number,
    skillLevel: string,
    hintsCount: number,
    totalActions: number,
  ): string[] {
    const insights: string[] = [];

    // Completion insight
    if (replay.metadata?.completed) {
      insights.push('✓ Successfully completed the puzzle');
    } else {
      insights.push('✗ Puzzle was not completed');
    }

    // Efficiency insight
    if (efficiency > 0.8) {
      insights.push('Excellent efficiency - minimal undo/redo actions');
    } else if (efficiency > 0.5) {
      insights.push('Good efficiency but some trial-and-error involved');
    } else {
      insights.push('Multiple attempts and corrections were needed');
    }

    // Skill level insight
    insights.push(`Skill level: ${skillLevel}`);

    // Hints insight
    if (hintsCount > 0) {
      const hintPercentage = Math.round((hintsCount / totalActions) * 100);
      insights.push(`Used ${hintsCount} hints (${hintPercentage}% of actions)`);
    } else {
      insights.push('Completed without using hints - excellent!');
    }

    // Strategy insight
    if (undoRedoRatio > 0.2) {
      insights.push('High undo/redo usage suggests trial-and-error approach');
    } else {
      insights.push('Deliberate and careful approach with few corrections');
    }

    // Time insight
    const totalDuration = replay.metadata?.totalDuration || actions[actions.length - 1]?.relativeTime || 0;
    const minutes = Math.floor(totalDuration / 60000);
    if (minutes > 0) {
      insights.push(`Completed in approximately ${minutes} minutes`);
    }

    return insights;
  }

  /**
   * Compare analytics across multiple replays
   */
  async compareReplays(replayIds: string[]): Promise<{
    individual: ReplayAnalytics[];
    comparison: {
      averageEfficiency: number;
      averageConsistency: number;
      skillLevelDistribution: Record<string, number>;
      mostCommonActionType: ActionType;
    };
  }> {
    const analytics = await Promise.all(
      replayIds.map((id) => this.generateAnalytics(id)),
    );

    const avgEfficiency = analytics.reduce((sum, a) => sum + a.efficiency, 0) / analytics.length;
    const avgConsistency = analytics.reduce((sum, a) => sum + a.performanceMetrics.consistencyScore, 0) / analytics.length;

    const skillDistribution: Record<string, number> = {};
    analytics.forEach((a) => {
      skillDistribution[a.playerSkillLevel] = (skillDistribution[a.playerSkillLevel] || 0) + 1;
    });

    // Find most common action type
    const allActions: Record<ActionType, number> = {} as any;
    for (const actionType of Object.values(ActionType)) {
      allActions[actionType] = 0;
    }

    analytics.forEach((a) => {
      Object.entries(a.actionBreakdown).forEach(([type, count]) => {
        allActions[type as ActionType] += count;
      });
    });

    const mostCommonActionType = Object.entries(allActions).sort(([, a], [, b]) => b - a)[0][0] as ActionType;

    return {
      individual: analytics,
      comparison: {
        averageEfficiency: Math.round(avgEfficiency),
        averageConsistency: Math.round(avgConsistency),
        skillLevelDistribution: skillDistribution,
        mostCommonActionType,
      },
    };
  }
}
