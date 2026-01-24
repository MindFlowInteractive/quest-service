import { Injectable } from '@nestjs/common';

interface HintRecord {
  userId: string;
  puzzleId: string;
  hint: any;
  timestamp: Date;
  wasHelpful?: boolean;
  ledToProgress?: boolean;
}

@Injectable()
export class EffectivenessTrackerService {
  private hintHistory: HintRecord[] = [];
  private playerHistory: Map<string, any[]> = new Map();

  async recordHintGiven(userId: string, puzzleId: string, hint: any): Promise<void> {
    const record: HintRecord = {
      userId,
      puzzleId,
      hint,
      timestamp: new Date(),
    };

    this.hintHistory.push(record);

    if (!this.playerHistory.has(userId)) {
      this.playerHistory.set(userId, []);
    }
    this.playerHistory.get(userId).push(record);
  }

  async recordHintFeedback(
    userId: string,
    puzzleId: string,
    hintId: string,
    wasHelpful: boolean,
    ledToProgress: boolean
  ): Promise<void> {
    const record = this.hintHistory.find(
      h => h.userId === userId && h.puzzleId === puzzleId
    );

    if (record) {
      record.wasHelpful = wasHelpful;
      record.ledToProgress = ledToProgress;
    }
  }

  async getPlayerHistory(userId: string): Promise<any[]> {
    return this.playerHistory.get(userId) || [];
  }

  async calculateEffectiveness(userId?: string): Promise<any> {
    const relevantHints = userId
      ? this.playerHistory.get(userId) || []
      : this.hintHistory;

    const totalHints = relevantHints.length;
    const helpfulHints = relevantHints.filter(h => h.wasHelpful).length;
    const progressHints = relevantHints.filter(h => h.ledToProgress).length;

    return {
      totalHints,
      helpfulRate: totalHints > 0 ? helpfulHints / totalHints : 0,
      progressRate: totalHints > 0 ? progressHints / totalHints : 0,
      averageHintsPerPuzzle: this.calculateAverageHintsPerPuzzle(relevantHints),
    };
  }

  private calculateAverageHintsPerPuzzle(hints: HintRecord[]): number {
    const puzzleMap = new Map<string, number>();
    
    hints.forEach(h => {
      puzzleMap.set(h.puzzleId, (puzzleMap.get(h.puzzleId) || 0) + 1);
    });

    const puzzleCounts = Array.from(puzzleMap.values());
    return puzzleCounts.length > 0
      ? puzzleCounts.reduce((a, b) => a + b, 0) / puzzleCounts.length
      : 0;
  }

  async getInsights(userId: string): Promise<any> {
    const history = await this.getPlayerHistory(userId);
    const effectiveness = await this.calculateEffectiveness(userId);

    return {
      effectiveness,
      mostHelpfulHintType: this.identifyMostHelpfulType(history),
      strugglingAreas: this.identifyStrugglingAreas(history),
      improvementTrend: this.calculateImprovementTrend(history),
    };
  }

  private identifyMostHelpfulType(history: any[]): string {
    const typeScores = new Map<string, number>();

    history.forEach(h => {
      if (h.wasHelpful) {
        const type = h.hint.type;
        typeScores.set(type, (typeScores.get(type) || 0) + 1);
      }
    });

    let maxType = 'question';
    let maxScore = 0;

    typeScores.forEach((score, type) => {
      if (score > maxScore) {
        maxScore = score;
        maxType = type;
      }
    });

    return maxType;
  }

  private identifyStrugglingAreas(history: any[]): string[] {
    // Identify puzzle types where player needed many hints
    const puzzleHintCounts = new Map<string, number>();

    history.forEach(h => {
      puzzleHintCounts.set(
        h.puzzleId,
        (puzzleHintCounts.get(h.puzzleId) || 0) + 1
      );
    });

    const struggling: string[] = [];
    puzzleHintCounts.forEach((count, puzzleId) => {
      if (count > 5) {
        struggling.push(puzzleId);
      }
    });

    return struggling;
  }

  private calculateImprovementTrend(history: any[]): string {
    if (history.length < 5) return 'insufficient_data';

    const recent = history.slice(-5);
    const older = history.slice(-10, -5);

    const recentAvg = recent.filter(h => h.wasHelpful).length / recent.length;
    const olderAvg = older.length > 0
      ? older.filter(h => h.wasHelpful).length / older.length
      : 0;

    if (recentAvg > olderAvg + 0.1) return 'improving';
    if (recentAvg < olderAvg - 0.1) return 'declining';
    return 'stable';
  }
}