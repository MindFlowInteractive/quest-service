import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { CreateLeaderboardEntryDto } from './dto/create-leaderboard-entry.dto';
import { Cache } from 'cache-manager';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LeaderboardEntry)
    private entryRepository: Repository<LeaderboardEntry>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
    await this.cacheManager.reset(); // Optionally, use a more granular invalidation
    return saved;
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
  ): Promise<Leaderboard & { entries: LeaderboardEntry[] }> {
    const cacheKey = `leaderboard:${leaderboardId}:${ranking}:${order}:${period || 'all'}`;
    const cached = await this.cacheManager.get<Leaderboard & { entries: LeaderboardEntry[] }>(cacheKey);
    if (cached) return cached;
    const leaderboard = await this.leaderboardRepository.findOne({
      where: { id: leaderboardId },
    });
    if (!leaderboard) throw new Error('Leaderboard not found');
    const entryWhere: any = { leaderboard: { id: leaderboardId } };
    if (period) entryWhere.period = period;
    const entries = await this.entryRepository.find({
      where: entryWhere,
      order: [
        { [ranking]: order },
        { userId: 'ASC' },
      ],
    });
    const result = { ...leaderboard, entries };
    await this.cacheManager.set(cacheKey, result, { ttl: 30 }); // Cache for 30 seconds
    return result;
  }
} 