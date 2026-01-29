import { Injectable } from '@nestjs/common';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { DifficultyScalingService } from './difficulty-scaling.service';

@Injectable()
export class DifficultyRecommendationService {
  constructor(
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly scalingService: DifficultyScalingService,
  ) {}

  /**
   * Recommends puzzles for a player based on their skill and preferences.
   */
  async recommendPuzzles(playerId: string, limit = 5): Promise<Puzzle[]> {
    const { min, max } = await this.scalingService.getRecommendedDifficultyRange(playerId);
    // Query puzzles in the recommended difficulty range, active and published
    return this.puzzleRepository.find({
      where: {
        difficultyRating: Between(min, max),
        isActive: true,
  publishedAt: Not(IsNull()),
      },
      order: { difficultyRating: 'ASC' },
      take: limit,
    });
  }
}
