import { Injectable } from '@nestjs/common';

export interface DifficultyFeedback {
  playerId: string;
  puzzleId: string;
  perceivedDifficulty: number; // 1-5
  feedbackText?: string;
  submittedAt: Date;
}

/**
 * Service for collecting and analyzing player feedback on puzzle difficulty.
 */
@Injectable()
export class DifficultyFeedbackService {
  // In production, use persistent storage or analytics platform
  private feedbacks: DifficultyFeedback[] = [];

  /**
   * Collects feedback from a player about a puzzle's difficulty.
   */
  submitFeedback(feedback: DifficultyFeedback) {
    this.feedbacks.push(feedback);
  }

  /**
   * Returns all feedback for a given puzzle.
   */
  getFeedbackForPuzzle(puzzleId: string): DifficultyFeedback[] {
    return this.feedbacks.filter(f => f.puzzleId === puzzleId);
  }

  /**
   * Analyzes feedback for a puzzle and returns average perceived difficulty.
   */
  getAveragePerceivedDifficulty(puzzleId: string): number {
    const feedbacks = this.getFeedbackForPuzzle(puzzleId);
    if (feedbacks.length === 0) return 0;
    return (
      feedbacks.reduce((sum, f) => sum + f.perceivedDifficulty, 0) /
      feedbacks.length
    );
  }
}
