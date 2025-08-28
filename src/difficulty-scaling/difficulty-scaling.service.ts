import { Injectable } from '@nestjs/common';
import { PlayerSkillService } from './player-skill.service';
import { PuzzleDifficultyService } from './puzzle-difficulty.service';

@Injectable()
export class DifficultyScalingService {
  constructor(
    private readonly playerSkillService: PlayerSkillService,
    private readonly puzzleDifficultyService: PuzzleDifficultyService,
  ) {}

  /**
   * Returns the recommended difficulty score for the next puzzle for the player.
   * Typically targets puzzles slightly above current skill for optimal challenge.
   */
  async getRecommendedDifficulty(playerId: string): Promise<number> {
    const skill = await this.playerSkillService.getPlayerSkill(playerId);
    // Example: target puzzles slightly above current skill
    return Math.min(Math.max(skill + 0.5, 1), 5);
  }

  /**
   * Returns a recommended difficulty range for adaptive puzzle selection.
   * Can be used to query puzzles in this range.
   */
  async getRecommendedDifficultyRange(playerId: string): Promise<{ min: number; max: number }> {
    const recommended = await this.getRecommendedDifficulty(playerId);
    // Example: +/- 0.5 around recommended, clamped to [1,5]
    return {
      min: Math.max(1, recommended - 0.5),
      max: Math.min(5, recommended + 0.5),
    };
  }
}
