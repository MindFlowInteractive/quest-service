import { Injectable } from '@nestjs/common';
import { PlayerSkillService } from './player-skill.service';
import { PuzzleDifficultyService } from './puzzle-difficulty.service';
import { DifficultyFeedbackService } from './difficulty-feedback.service';

@Injectable()
export class DifficultyAnalyticsService {
  constructor(
    private readonly playerSkillService: PlayerSkillService,
    private readonly puzzleDifficultyService: PuzzleDifficultyService,
    private readonly feedbackService: DifficultyFeedbackService,
  ) {}

  /**
   * Returns analytics for a player: skill, recent progress, etc.
   */
  async getPlayerAnalytics(playerId: string) {
    const skill = await this.playerSkillService.getPlayerSkill(playerId);
    // Extend with more analytics as needed
    return { skill };
  }

  /**
   * Returns analytics for a puzzle: difficulty, perceived difficulty, etc.
   */
  async getPuzzleAnalytics(puzzleId: string) {
    const difficulty = await this.puzzleDifficultyService.getPuzzleDifficulty(puzzleId);
    const perceived = this.feedbackService.getAveragePerceivedDifficulty(puzzleId);
    // Extend with more analytics as needed
    return { difficulty, perceivedDifficulty: perceived };
  }
}
