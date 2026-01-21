import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from '../leaderboard-entry.entity';
import { CreateLeaderboardEntryDto, UpdateLeaderboardScoreDto } from '../dto';

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  /**
   * Create or get leaderboard entry for a user
   */
  async createOrGetEntry(
    dto: CreateLeaderboardEntryDto,
  ): Promise<LeaderboardEntry> {
    let entry = await this.leaderboardRepository.findOne({
      where: {
        userId: dto.userId,
        seasonId: dto.seasonId || 'current',
      },
    });

    if (!entry) {
      entry = this.leaderboardRepository.create({
        userId: dto.userId,
        score: dto.score,
        displayName: dto.displayName,
        seasonId: dto.seasonId || 'current',
      });
      await this.leaderboardRepository.save(entry);
    }

    // Recalculate ranks
    await this.recalculateRankings(entry.seasonId);

    return this.leaderboardRepository.findOne({
      where: { id: entry.id },
    });
  }

  /**
   * Update user score and recalculate rankings
   */
  async updateScore(
    userId: string,
    seasonId: string,
    dto: UpdateLeaderboardScoreDto,
  ): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({
      where: { userId, seasonId },
    });

    if (!entry) {
      throw new NotFoundException('Leaderboard entry not found');
    }

    entry.score = dto.score;
    entry.wins = dto.wins;
    entry.losses = dto.losses;
    entry.updatedAt = new Date();

    await this.leaderboardRepository.save(entry);

    // Recalculate rankings
    await this.recalculateRankings(seasonId);

    return this.leaderboardRepository.findOne({
      where: { id: entry.id },
    });
  }

  /**
   * Add score points to user
   */
  async addScore(
    userId: string,
    seasonId: string,
    points: number,
  ): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({
      where: { userId, seasonId },
    });

    if (!entry) {
      throw new NotFoundException('Leaderboard entry not found');
    }

    entry.score = Math.max(0, entry.score + points);
    entry.updatedAt = new Date();

    await this.leaderboardRepository.save(entry);

    // Recalculate rankings
    await this.recalculateRankings(seasonId);

    return this.leaderboardRepository.findOne({
      where: { id: entry.id },
    });
  }

  /**
   * Record a win for a user
   */
  async recordWin(
    userId: string,
    seasonId: string,
    pointsGained: number = 10,
  ): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({
      where: { userId, seasonId },
    });

    if (!entry) {
      throw new NotFoundException('Leaderboard entry not found');
    }

    entry.wins += 1;
    entry.score = Math.max(0, entry.score + pointsGained);
    entry.updatedAt = new Date();

    await this.leaderboardRepository.save(entry);

    // Recalculate rankings
    await this.recalculateRankings(seasonId);

    return this.leaderboardRepository.findOne({
      where: { id: entry.id },
    });
  }

  /**
   * Record a loss for a user
   */
  async recordLoss(
    userId: string,
    seasonId: string,
    pointsLost: number = 5,
  ): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({
      where: { userId, seasonId },
    });

    if (!entry) {
      throw new NotFoundException('Leaderboard entry not found');
    }

    entry.losses += 1;
    entry.score = Math.max(0, entry.score - pointsLost);
    entry.updatedAt = new Date();

    await this.leaderboardRepository.save(entry);

    // Recalculate rankings
    await this.recalculateRankings(seasonId);

    return this.leaderboardRepository.findOne({
      where: { id: entry.id },
    });
  }

  /**
   * Get user's leaderboard entry
   */
  async getUserEntry(
    userId: string,
    seasonId: string = 'current',
  ): Promise<LeaderboardEntry> {
    const entry = await this.leaderboardRepository.findOne({
      where: { userId, seasonId },
    });

    if (!entry) {
      throw new NotFoundException('Leaderboard entry not found');
    }

    return entry;
  }

  /**
   * Get top N players for a season
   */
  async getTopPlayers(
    seasonId: string = 'current',
    limit: number = 100,
  ): Promise<LeaderboardEntry[]> {
    if (limit < 1 || limit > 1000) {
      throw new BadRequestException('Limit must be between 1 and 1000');
    }

    return this.leaderboardRepository.find({
      where: { seasonId },
      order: { rank: 'ASC' },
      take: limit,
    });
  }

  /**
   * Get player rank and nearby players
   */
  async getPlayerRankContext(
    userId: string,
    seasonId: string = 'current',
    contextSize: number = 5,
  ): Promise<{
    player: LeaderboardEntry;
    nearby: LeaderboardEntry[];
  }> {
    const player = await this.getUserEntry(userId, seasonId);

    const startRank = Math.max(1, player.rank - contextSize);
    const endRank = player.rank + contextSize;

    const nearby = await this.leaderboardRepository.find({
      where: { seasonId },
      order: { rank: 'ASC' },
      skip: startRank - 1,
      take: endRank - startRank + 1,
    });

    return { player, nearby };
  }

  /**
   * Get leaderboard entries with pagination
   */
  async getLeaderboard(
    seasonId: string = 'current',
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{
    entries: LeaderboardEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    if (page < 1 || pageSize < 1 || pageSize > 500) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const [entries, total] = await this.leaderboardRepository.findAndCount({
      where: { seasonId },
      order: { rank: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { entries, total, page, pageSize };
  }

  /**
   * Recalculate rankings for a season (should be called after score updates)
   */
  async recalculateRankings(seasonId: string): Promise<void> {
    // Get all entries sorted by score descending
    const entries = await this.leaderboardRepository.find({
      where: { seasonId },
      order: { score: 'DESC' },
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
    }

    await this.leaderboardRepository.save(entries);
  }

  /**
   * Start a new season (reset leaderboard)
   */
  async startNewSeason(newSeasonId: string): Promise<void> {
    // This could copy top performers to hall of fame, etc.
    // For now, just prepare for new season
    const entries = await this.leaderboardRepository.find({
      order: { score: 'DESC' },
      take: 100, // Save top 100
    });

    // In production, you might save these to a hall of fame table
    console.log(`Starting new season ${newSeasonId}. Top performers archived.`);
  }

  /**
   * Get season statistics
   */
  async getSeasonStats(seasonId: string): Promise<{
    totalPlayers: number;
    topScore: number;
    averageScore: number;
    totalMatches: number;
  }> {
    const entries = await this.leaderboardRepository.find({
      where: { seasonId },
    });

    if (entries.length === 0) {
      return {
        totalPlayers: 0,
        topScore: 0,
        averageScore: 0,
        totalMatches: 0,
      };
    }

    const topScore = Math.max(...entries.map((e) => e.score));
    const averageScore =
      entries.reduce((sum, e) => sum + e.score, 0) / entries.length;
    const totalMatches = entries.reduce(
      (sum, e) => sum + e.wins + e.losses,
      0,
    );

    return {
      totalPlayers: entries.length,
      topScore,
      averageScore,
      totalMatches,
    };
  }

  /**
   * Get win rate for a user
   */
  async getWinRate(userId: string, seasonId: string = 'current'): Promise<number> {
    const entry = await this.getUserEntry(userId, seasonId);
    const totalMatches = entry.wins + entry.losses;

    if (totalMatches === 0) {
      return 0;
    }

    return (entry.wins / totalMatches) * 100;
  }
}
