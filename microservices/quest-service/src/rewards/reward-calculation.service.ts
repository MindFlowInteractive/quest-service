import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../../../../src/puzzles/entities/puzzle.entity';

@Injectable()
export class RewardCalculationService {
  private readonly logger = new Logger(RewardCalculationService.name);

  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
  ) {}

  /**
   * Calculates token rewards based on puzzle difficulty and other factors
   */
  async calculatePuzzleReward(puzzleId: string, completionTime?: number, hintsUsed?: number): Promise<number> {
    try {
      const puzzle = await this.puzzleRepository.findOne({
        where: { id: puzzleId },
      });

      if (!puzzle) {
        throw new Error(`Puzzle with ID ${puzzleId} not found`);
      }

      // Base reward based on puzzle difficulty
      let baseReward = this.getBaseRewardForDifficulty(puzzle.difficulty);
      
      // Adjust reward based on completion time (faster completion gets bonus)
      let timeMultiplier = 1.0;
      if (completionTime && puzzle.timeLimit) {
        const efficiency = puzzle.timeLimit / completionTime;
        if (efficiency > 1) {
          // Completed faster than expected
          timeMultiplier = Math.min(2.0, 1.0 + (efficiency - 1) * 0.2); // Up to 2x multiplier
        } else {
          // Completed slower than expected
          timeMultiplier = Math.max(0.5, efficiency * 0.8); // Minimum 0.5x multiplier
        }
      }

      // Adjust reward based on hints used (less hints = higher reward)
      let hintMultiplier = 1.0;
      if (hintsUsed !== undefined && puzzle.maxHints) {
        if (hintsUsed === 0) {
          hintMultiplier = 1.5; // Bonus for completing without hints
        } else if (hintsUsed > 0) {
          hintMultiplier = Math.max(0.7, 1.0 - (hintsUsed / puzzle.maxHints) * 0.3); // Up to 30% reduction
        }
      }

      // Final reward calculation
      const finalReward = baseReward * timeMultiplier * hintMultiplier;

      this.logger.log(`Calculated reward for puzzle ${puzzleId}: ${finalReward} tokens (base: ${baseReward}, timeMult: ${timeMultiplier}, hintMult: ${hintMultiplier})`);

      return Math.round(finalReward * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      this.logger.error(`Error calculating reward for puzzle ${puzzleId}:`, error);
      throw error;
    }
  }

  /**
   * Gets base reward amount based on puzzle difficulty
   */
  private getBaseRewardForDifficulty(difficulty: string): number {
    const baseRewards = {
      'easy': 10,
      'medium': 25,
      'hard': 50,
      'expert': 100,
    };

    const baseRewardValue = (baseRewards as { [key: string]: number })[difficulty];
    return baseRewardValue || baseRewards.medium; // Default to medium if unknown difficulty
  }

  /**
   * Calculates rewards for batch processing
   */
  async calculateBatchRewards(puzzleIds: string[]): Promise<{ [puzzleId: string]: number }> {
    const rewards: { [puzzleId: string]: number } = {};

    for (const puzzleId of puzzleIds) {
      try {
        rewards[puzzleId] = await this.calculatePuzzleReward(puzzleId);
      } catch (error) {
        this.logger.error(`Failed to calculate reward for puzzle ${puzzleId}:`, error);
        rewards[puzzleId] = 0; // Default to 0 if calculation fails
      }
    }

    return rewards;
  }
}