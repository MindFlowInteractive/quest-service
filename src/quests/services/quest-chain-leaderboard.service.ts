import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { QuestChain } from '../entities/quest-chain.entity';
import { User } from '../../users/entities/user.entity';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  value: number; // Time in seconds for speed runs, score for other metrics
  completedAt?: Date;
  chainName?: string;
}

@Injectable()
export class QuestChainLeaderboardService {
  private readonly logger = new Logger(QuestChainLeaderboardService.name);

  constructor(
    @InjectRepository(UserQuestChainProgress)
    private readonly userProgressRepository: Repository<UserQuestChainProgress>,
    @InjectRepository(QuestChain)
    private readonly questChainRepository: Repository<QuestChain>,
  ) {}

  async getSpeedRunLeaderboard(chainId: string, limit = 10): Promise<LeaderboardEntry[]> {
    const completedProgresses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        'progress.userId',
        'progress.totalTime',
        'progress.completedAt',
      ])
      .where('progress.questChainId = :chainId', { chainId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .orderBy('progress.totalTime', 'ASC')
      .limit(limit)
      .getRawMany();

    return completedProgresses.map((progress, index) => ({
      rank: index + 1,
      userId: progress.progress_userId,
      username: `User ${progress.progress_userId}`,
      value: progress.progress_totalTime,
      completedAt: progress.progress_completedAt,
    }));
  }

  async getScoreLeaderboard(chainId: string, limit = 10): Promise<LeaderboardEntry[]> {
    const completedProgresses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        'progress.userId',
        'progress.totalScore',
        'progress.completedAt',
      ])
      .where('progress.questChainId = :chainId', { chainId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .orderBy('progress.totalScore', 'DESC')
      .limit(limit)
      .getRawMany();

    return completedProgresses.map((progress, index) => ({
      rank: index + 1,
      userId: progress.progress_userId,
      username: `User ${progress.progress_userId}`,
      value: progress.progress_totalScore,
      completedAt: progress.progress_completedAt,
    }));
  }

  async getTotalCompletionsLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const chainCompletions = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        'progress.userId',
        'COUNT(progress.id) as completionCount',
      ])
      .where('progress.status = :status', { status: 'completed' })
      .groupBy('progress.userId')
      .orderBy('completionCount', 'DESC')
      .limit(limit)
      .getRawMany();

    return chainCompletions.map((completion, index) => ({
      rank: index + 1,
      userId: completion.progress_userId,
      username: `User ${completion.progress_userId}`,
      value: parseInt(completion.completionCount),
    }));
  }

  async getUserRankInChain(userId: string, chainId: string): Promise<number | null> {
    const completedProgresses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .select([
        'progress.userId',
        'progress.totalTime',
      ])
      .where('progress.questChainId = :chainId', { chainId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .orderBy('progress.totalTime', 'ASC')
      .getRawMany();

    const userProgress = completedProgresses.find(p => p.progress_userId === userId);
    if (!userProgress) return null;

    return completedProgresses.findIndex(p => p.progress_userId === userId) + 1;
  }

  async getChainCompletionStats(chainId: string): Promise<{
    totalParticipants: number;
    totalCompletions: number;
    averageTime: number;
    fastestCompletion: number;
    successRate: number;
  }> {
    const allProgresses = await this.userProgressRepository
      .createQueryBuilder('progress')
      .where('progress.questChainId = :chainId', { chainId })
      .getMany();

    const completedProgresses = allProgresses.filter(p => p.status === 'completed');

    const totalParticipants = allProgresses.length;
    const totalCompletions = completedProgresses.length;
    const successRate = totalParticipants > 0 ? (totalCompletions / totalParticipants) * 100 : 0;

    let averageTime = 0;
    let fastestCompletion = Infinity;

    if (completedProgresses.length > 0) {
      const totalTime = completedProgresses.reduce((sum, progress) => sum + progress.totalTime, 0);
      averageTime = totalTime / completedProgresses.length;

      fastestCompletion = Math.min(...completedProgresses.map(p => p.totalTime));
    } else {
      fastestCompletion = 0;
    }

    return {
      totalParticipants,
      totalCompletions,
      averageTime,
      fastestCompletion: fastestCompletion === Infinity ? 0 : fastestCompletion,
      successRate,
    };
  }
}