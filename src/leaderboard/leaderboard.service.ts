import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard } from './entities/leaderboard.entity';
import { LeaderboardEntry } from './entities/leaderboard-entry.entity';
import { CreateLeaderboardDto } from './dto/create-leaderboard.dto';
import { CreateLeaderboardEntryDto } from './dto/create-leaderboard-entry.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    @InjectRepository(LeaderboardEntry)
    private entryRepository: Repository<LeaderboardEntry>,
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
    return this.entryRepository.save(entry);
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
    return { ...leaderboard, entries };
  }
} 