import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInteraction } from '../entities/user-interaction.entity';

export interface InteractionSummary {
  userId: string;
  puzzleId: string;
  interactionType: string;
  value?: number;
  completionTime?: number;
  hintsUsed?: number;
  attempts?: number;
}

@Injectable()
export class UserInteractionRepository {
  constructor(
    @InjectRepository(UserInteraction)
    private repository: Repository<UserInteraction>,
  ) {}

  async findUserCompletions(userId: string, limit: number = 100): Promise<UserInteraction[]> {
    return this.repository.find({
      where: { 
        userId,
        interactionType: 'complete'
      },
      relations: ['puzzle'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findUserInteractionsByType(
    userId: string,
    interactionType: string,
    limit?: number,
  ): Promise<UserInteraction[]> {
    const query = this.repository
      .createQueryBuilder('interaction')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.interactionType = :interactionType', { interactionType })
      .orderBy('interaction.createdAt', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  async findSimilarUserInteractions(
    puzzleIds: string[],
    excludeUserId: string,
    minCommonPuzzles: number = 2,
    limit: number = 50,
  ): Promise<Array<{ userId: string; commonPuzzles: number; puzzleIds: string[] }>> {
    if (puzzleIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('interaction')
      .select('interaction.userId', 'userId')
      .addSelect('COUNT(*)', 'commonPuzzles')
      .addSelect('array_agg(interaction.puzzleId)', 'puzzleIds')
      .where('interaction.puzzleId IN (:...puzzleIds)', { puzzleIds })
      .andWhere('interaction.userId != :excludeUserId', { excludeUserId })
      .andWhere('interaction.interactionType = :type', { type: 'complete' })
      .groupBy('interaction.userId')
      .having('COUNT(*) >= :minCommon', { minCommon: minCommonPuzzles })
      .orderBy('COUNT(*)', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getCompletedPuzzleIds(userId: string): Promise<string[]> {
    const interactions = await this.repository.find({
      where: { 
        userId,
        interactionType: 'complete'
      },
      select: ['puzzleId'],
    });

    return interactions.map(i => i.puzzleId);
  }

  async getUserInteractionCount(userId: string, interactionType?: string): Promise<number> {
    const query = this.repository
      .createQueryBuilder('interaction')
      .where('interaction.userId = :userId', { userId });

    if (interactionType) {
      query.andWhere('interaction.interactionType = :interactionType', { interactionType });
    }

    return query.getCount();
  }

  async getInteractionSummary(userId: string, puzzleId: string): Promise<InteractionSummary[]> {
    const interactions = await this.repository.find({
      where: { userId, puzzleId },
      order: { createdAt: 'ASC' },
    });

    return interactions.map(interaction => ({
      userId: interaction.userId,
      puzzleId: interaction.puzzleId,
      interactionType: interaction.interactionType,
      value: interaction.value,
      completionTime: interaction.metadata?.completionTime,
      hintsUsed: interaction.metadata?.hintsUsed,
      attempts: interaction.metadata?.attempts,
    }));
  }

  async createInteraction(
    userId: string,
    puzzleId: string,
    interactionType: string,
    value?: number,
    metadata?: any,
  ): Promise<UserInteraction> {
    const interaction = this.repository.create({
      userId,
      puzzleId,
      interactionType: interactionType as any,
      value,
      metadata,
    });

    return this.repository.save(interaction) as unknown as Promise<UserInteraction>;
  }

  async getUserActivityStats(userId: string): Promise<{
    totalInteractions: number;
    completions: number;
    averageRating: number;
    categoryCounts: Record<string, number>;
  }> {
    const interactions = await this.repository.find({
      where: { userId },
      relations: ['puzzle'],
    });

    const completions = interactions.filter(i => i.interactionType === 'complete');
    const ratings = interactions.filter(i => i.interactionType === 'rate' && i.value);
    
    const categoryCounts: Record<string, number> = {};
    completions.forEach(interaction => {
      const category = interaction.puzzle?.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    const totalRating = ratings.reduce((sum, r) => sum + (r.value || 0), 0);
    const averageRating = ratings.length > 0 ? totalRating / ratings.length : 0;

    return {
      totalInteractions: interactions.length,
      completions: completions.length,
      averageRating,
      categoryCounts,
    };
  }
}