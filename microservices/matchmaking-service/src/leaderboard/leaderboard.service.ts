import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { CreateLeaderboardEntryDto } from './dto/create-leaderboard-entry.dto';
import { Cache } from 'cache-manager';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LeaderboardEntry)
    private entryRepository: Repository<LeaderboardEntry>,
    @Inject(CACHE_MANAGER) private cacheManager: any,
    private achievementsService: AchievementsService,
  ) { }

  async createLeaderboard(dto: CreateLeaderboardDto): Promise<Leaderboard> {
    const leaderboard = this.leaderboardRepository.create(dto);
    return this.leaderboardRepository.save(leaderboard);
  }

  async createEntry(dto: CreateLeaderboardEntryDto): Promise<LeaderboardEntry> {
    const entry = this.entryRepository.create({
      ...dto,
      leaderboard: { id: dto.leaderboardId },
    });
    const saved = await this.entryRepository.save(entry);
    // Invalidate cache for this leaderboard
    await this.cacheManager.reset();
    // Award leaderboard achievements if criteria met
    await this.checkAndAwardLeaderboardAchievements(dto.leaderboardId, dto.userId);
    return saved;
  }

  private async checkAndAwardLeaderboardAchievements(leaderboardId: number, userId: number) {
    // Find all leaderboard achievements for this leaderboard
    // (Assume AchievementsService has a method to find by type/criteria)
    const achievements = await this.achievementsService.findLeaderboardAchievements(leaderboardId);
    if (!achievements?.length) return;
    // Get current leaderboard entries ordered by score DESC
    const entries = await this.entryRepository.find({
      where: { leaderboard: { id: leaderboardId } },
      order: { score: 'DESC', userId: 'ASC' },
    });
    const userRank = entries.findIndex(e => e.userId === userId) + 1;
    for (const achievement of achievements) {
      const criteria = (achievement as any).criteria;
      if (criteria?.rank && userRank > 0 && userRank <= criteria.rank) {
        await this.achievementsService.awardAchievementToUser(achievement.id, userId);
      }
    }
  }

  async getLeaderboardsByCategoryAndPeriod(category: string, period: string): Promise<Leaderboard[]> {
    return this.leaderboardRepository.find({
      where: { category, period, isActive: true },
    });
  }

  async getLeaderboardWithEntries(
    leaderboardId: number,
    ranking: 'score' | 'timeTaken' | 'efficiency' = 'score',
    order: 'ASC' | 'DESC' = 'DESC',
    period?: string,
    userId?: number,
  ): Promise<Leaderboard & { entries: LeaderboardEntry[] }> {
    const cacheKey = `leaderboard:${leaderboardId}:${ranking}:${order}:${period || 'all'}:${userId || 'anon'}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    const leaderboard = await this.leaderboardRepository.findOne({
      where: { id: leaderboardId },
    });
    if (!leaderboard) throw new Error('Leaderboard not found');
    // Privacy/visibility check
    if (leaderboard.visibility === 'private' && (!userId || !leaderboard.allowedUserIds?.includes(userId))) {
      throw new Error('Access denied: private leaderboard');
    }
    if (leaderboard.visibility === 'friends' && (!userId || !leaderboard.allowedUserIds?.includes(userId))) {
      throw new Error('Access denied: friends-only leaderboard');
    }
    const entryWhere: any = { leaderboard: { id: leaderboardId } };
    if (period) entryWhere.period = period;
    const entries = await this.entryRepository.find({
      where: entryWhere,
      order: {
        [ranking]: order,
        userId: 'ASC',
      } as any,
    });
    const result = { ...leaderboard, entries };
    await this.cacheManager.set(cacheKey, result, { ttl: 30 });
    return result;
  }

  async getLeaderboardAnalytics(leaderboardId: number) {
    // Only consider non-archived entries
    const entries = await this.entryRepository.find({
      where: { leaderboard: { id: leaderboardId }, archived: false },
    });
    const participantSet = new Set(entries.map(e => e.userId));
    const participantCount = participantSet.size;
    const entryCount = entries.length;
    const averageScore = entries.length ? entries.reduce((sum, e) => sum + (e.score || 0), 0) / entries.length : 0;
    // Top 5 users by score
    const topUsers = entries
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(e => ({ userId: e.userId, score: e.score }));
    return {
      participantCount,
      entryCount,
      averageScore,
      topUsers,
    };
  }

  async archiveAndResetLeaderboard(leaderboardId: number): Promise<void> {
    const now = new Date();
    // Mark all non-archived entries as archived
    await this.entryRepository.update(
      { leaderboard: { id: leaderboardId }, archived: false },
      { archived: true, archivedAt: now }
    );
    // Optionally, delete or keep archived entries; here we keep them for history
    // (If you want to delete, use delete instead of update above)
    // Invalidate cache
    await this.cacheManager.reset();
  }

  async getUserRankSummary(leaderboardId: number, userId: number) {
    const entries = await this.entryRepository.find({
      where: { leaderboard: { id: leaderboardId }, archived: false },
      order: { score: 'DESC', userId: 'ASC' },
    });
    const userRank = entries.findIndex(e => e.userId === userId) + 1;
    const userEntry = entries.find(e => e.userId === userId);
    if (!userEntry) return { userId, rank: null, score: null, shareMessage: 'No entry found.' };
    const shareMessage = `I am ranked #${userRank} on the leaderboard with a score of ${userEntry.score}! Can you beat me?`;
    return { userId, rank: userRank, score: userEntry.score, shareMessage };
  }

  async challengeUser(leaderboardId: number, fromUserId: number, toUserId: number) {
    // Stub: In a real app, you might send a notification or create a challenge record
    return { message: `User ${fromUserId} challenged user ${toUserId} on leaderboard ${leaderboardId}` };
  }
} 