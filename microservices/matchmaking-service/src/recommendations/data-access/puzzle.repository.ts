import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

export interface PuzzleFilters {
  category?: string;
  difficulty?: string;
  excludeIds?: string[];
  minRating?: number;
  maxAge?: number; // in days
}

export interface PuzzleWithMetrics extends Puzzle {
  ageInDays: number;
  completionRate: number;
}

@Injectable()
export class PuzzleRepository {
  constructor(
    @InjectRepository(Puzzle)
    private repository: Repository<Puzzle>,
  ) {}

  async findActivePuzzles(
    filters: PuzzleFilters = {},
    limit: number = 50,
  ): Promise<PuzzleWithMetrics[]> {
    let query = this.repository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt IS NOT NULL');

    if (filters.category) {
      query = query.andWhere('puzzle.category = :category', { category: filters.category });
    }

    if (filters.difficulty) {
      query = query.andWhere('puzzle.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludeIds)', { 
        excludeIds: filters.excludeIds 
      });
    }

    if (filters.minRating) {
      query = query.andWhere('puzzle.averageRating >= :minRating', { 
        minRating: filters.minRating 
      });
    }

    if (filters.maxAge) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.maxAge);
      query = query.andWhere('puzzle.publishedAt >= :cutoffDate', { cutoffDate });
    }

    const puzzles = await query
      .orderBy('puzzle.averageRating', 'DESC')
      .addOrderBy('puzzle.completions', 'DESC')
      .limit(limit)
      .getMany();

    return this.enrichWithMetrics(puzzles);
  }

  async findPopularPuzzles(
    filters: PuzzleFilters = {},
    limit: number = 20,
  ): Promise<PuzzleWithMetrics[]> {
    let query = this.repository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt IS NOT NULL');

    if (filters.category) {
      query = query.andWhere('puzzle.category = :category', { category: filters.category });
    }

    if (filters.difficulty) {
      query = query.andWhere('puzzle.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludeIds)', { 
        excludeIds: filters.excludeIds 
      });
    }

    const puzzles = await query
      .orderBy('puzzle.completions', 'DESC')
      .addOrderBy('puzzle.averageRating', 'DESC')
      .limit(limit)
      .getMany();

    return this.enrichWithMetrics(puzzles);
  }

  async findPuzzlesByIds(puzzleIds: string[]): Promise<PuzzleWithMetrics[]> {
    if (puzzleIds.length === 0) {
      return [];
    }

    const puzzles = await this.repository.findByIds(puzzleIds);
    return this.enrichWithMetrics(puzzles);
  }

  async findSimilarPuzzles(
    targetPuzzle: Puzzle,
    limit: number = 10,
    excludeIds: string[] = [],
  ): Promise<PuzzleWithMetrics[]> {
    let query = this.repository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt IS NOT NULL')
      .andWhere('puzzle.id != :targetId', { targetId: targetPuzzle.id });

    if (excludeIds.length > 0) {
      query = query.andWhere('puzzle.id NOT IN (:...excludeIds)', { excludeIds });
    }

    // Find puzzles with similar characteristics
    query = query.andWhere(
      '(puzzle.category = :category OR puzzle.difficulty = :difficulty OR puzzle.tags && :tags)',
      {
        category: targetPuzzle.category,
        difficulty: targetPuzzle.difficulty,
        tags: targetPuzzle.tags,
      }
    );

    const puzzles = await query
      .orderBy('puzzle.averageRating', 'DESC')
      .limit(limit)
      .getMany();

    return this.enrichWithMetrics(puzzles);
  }

  async getCategoryStats(): Promise<Record<string, {
    count: number;
    avgRating: number;
    avgCompletions: number;
  }>> {
    const stats = await this.repository
      .createQueryBuilder('puzzle')
      .select('puzzle.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(puzzle.averageRating)', 'avgRating')
      .addSelect('AVG(puzzle.completions)', 'avgCompletions')
      .where('puzzle.isActive = :active', { active: true })
      .groupBy('puzzle.category')
      .getRawMany();

    const result: Record<string, any> = {};
    stats.forEach(stat => {
      result[stat.category] = {
        count: parseInt(stat.count),
        avgRating: parseFloat(stat.avgRating) || 0,
        avgCompletions: parseFloat(stat.avgCompletions) || 0,
      };
    });

    return result;
  }

  async getDifficultyDistribution(): Promise<Record<string, number>> {
    const distribution = await this.repository
      .createQueryBuilder('puzzle')
      .select('puzzle.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .where('puzzle.isActive = :active', { active: true })
      .groupBy('puzzle.difficulty')
      .getRawMany();

    const result: Record<string, number> = {};
    distribution.forEach(item => {
      result[item.difficulty] = parseInt(item.count);
    });

    return result;
  }

  async getRecentPuzzles(days: number = 7, limit: number = 20): Promise<PuzzleWithMetrics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const puzzles = await this.repository
      .createQueryBuilder('puzzle')
      .where('puzzle.isActive = :active', { active: true })
      .andWhere('puzzle.publishedAt >= :cutoffDate', { cutoffDate })
      .orderBy('puzzle.publishedAt', 'DESC')
      .limit(limit)
      .getMany();

    return this.enrichWithMetrics(puzzles);
  }

  private enrichWithMetrics(puzzles: Puzzle[]): PuzzleWithMetrics[] {
    const now = new Date();
    
    return puzzles.map(puzzle => {
      const publishedAt = puzzle.publishedAt || puzzle.createdAt;
      const ageInDays = Math.floor((now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
      const completionRate = puzzle.attempts > 0 ? puzzle.completions / puzzle.attempts : 0;

      return {
        ...puzzle,
        ageInDays,
        completionRate,
      };
    });
  }
}