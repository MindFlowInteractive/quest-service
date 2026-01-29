import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEvent } from '../entities/player-event.entity';
import { SeasonalEvent } from '../entities/seasonal-event.entity';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  score: number;
  puzzlesCompleted: number;
  currentStreak: number;
  bestStreak: number;
  lastActivityAt: Date;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(PlayerEvent)
    private readonly playerEventRepository: Repository<PlayerEvent>,
    @InjectRepository(SeasonalEvent)
    private readonly eventRepository: Repository<SeasonalEvent>,
  ) {}

  /**
   * Get top players for an event (default top 10)
   */
  async getEventLeaderboard(
    eventId: string,
    limit: number = 10,
  ): Promise<LeaderboardEntry[]> {
    // Verify event exists
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const playerEvents = await this.playerEventRepository.find({
      where: { eventId },
      order: {
        score: 'DESC',
        puzzlesCompleted: 'DESC',
        lastActivityAt: 'ASC',
      },
      take: limit,
    });

    return playerEvents.map((pe, index) => ({
      rank: index + 1,
      playerId: pe.playerId,
      score: pe.score,
      puzzlesCompleted: pe.puzzlesCompleted,
      currentStreak: pe.currentStreak,
      bestStreak: pe.bestStreak,
      lastActivityAt: pe.lastActivityAt,
    }));
  }

  /**
   * Get leaderboard with player's position highlighted
   */
  async getLeaderboardWithPlayer(
    eventId: string,
    playerId: string,
    topCount: number = 10,
  ): Promise<{
    topPlayers: LeaderboardEntry[];
    playerEntry?: LeaderboardEntry;
    totalParticipants: number;
  }> {
    // Get top players
    const topPlayers = await this.getEventLeaderboard(eventId, topCount);

    // Get player's entry
    const playerEvent = await this.playerEventRepository.findOne({
      where: { playerId, eventId },
    });

    let playerEntry: LeaderboardEntry | undefined;

    if (playerEvent) {
      // Get player's rank
      const allPlayerEvents = await this.playerEventRepository.find({
        where: { eventId },
        order: {
          score: 'DESC',
          puzzlesCompleted: 'DESC',
          lastActivityAt: 'ASC',
        },
      });

      const rank = allPlayerEvents.findIndex((pe) => pe.playerId === playerId) + 1;

      playerEntry = {
        rank,
        playerId: playerEvent.playerId,
        score: playerEvent.score,
        puzzlesCompleted: playerEvent.puzzlesCompleted,
        currentStreak: playerEvent.currentStreak,
        bestStreak: playerEvent.bestStreak,
        lastActivityAt: playerEvent.lastActivityAt,
      };
    }

    const totalParticipants = await this.playerEventRepository.count({
      where: { eventId },
    });

    return {
      topPlayers,
      playerEntry,
      totalParticipants,
    };
  }

  /**
   * Get leaderboard by category (players who completed most puzzles in a category)
   */
  async getCategoryLeaderboard(
    eventId: string,
    category: string,
    limit: number = 10,
  ): Promise<Array<{
    rank: number;
    playerId: string;
    categoryPuzzlesCompleted: number;
    totalScore: number;
  }>> {
    const playerEvents = await this.playerEventRepository.find({
      where: { eventId },
    });

    // Filter and sort by category completion
    const categoryLeaderboard = playerEvents
      .map((pe) => ({
        playerId: pe.playerId,
        categoryPuzzlesCompleted: pe.statistics.categoryBreakdown?.[category] || 0,
        totalScore: pe.score,
      }))
      .filter((entry) => entry.categoryPuzzlesCompleted > 0)
      .sort((a, b) => {
        if (b.categoryPuzzlesCompleted !== a.categoryPuzzlesCompleted) {
          return b.categoryPuzzlesCompleted - a.categoryPuzzlesCompleted;
        }
        return b.totalScore - a.totalScore;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return categoryLeaderboard;
  }

  /**
   * Get streak leaderboard (players with best streaks)
   */
  async getStreakLeaderboard(
    eventId: string,
    limit: number = 10,
  ): Promise<Array<{
    rank: number;
    playerId: string;
    bestStreak: number;
    currentStreak: number;
    score: number;
  }>> {
    const playerEvents = await this.playerEventRepository.find({
      where: { eventId },
      order: {
        bestStreak: 'DESC',
        currentStreak: 'DESC',
        score: 'DESC',
      },
      take: limit,
    });

    return playerEvents.map((pe, index) => ({
      rank: index + 1,
      playerId: pe.playerId,
      bestStreak: pe.bestStreak,
      currentStreak: pe.currentStreak,
      score: pe.score,
    }));
  }

  /**
   * Get speed leaderboard (players with best average completion time)
   */
  async getSpeedLeaderboard(
    eventId: string,
    limit: number = 10,
  ): Promise<Array<{
    rank: number;
    playerId: string;
    averageCompletionTime: number;
    puzzlesCompleted: number;
    score: number;
  }>> {
    const playerEvents = await this.playerEventRepository.find({
      where: { eventId },
    });

    // Filter players who completed at least 3 puzzles
    const speedLeaderboard = playerEvents
      .filter((pe) => pe.puzzlesCompleted >= 3)
      .sort((a, b) => {
        if (a.averageCompletionTime !== b.averageCompletionTime) {
          return a.averageCompletionTime - b.averageCompletionTime;
        }
        return b.score - a.score;
      })
      .slice(0, limit)
      .map((pe, index) => ({
        rank: index + 1,
        playerId: pe.playerId,
        averageCompletionTime: pe.averageCompletionTime,
        puzzlesCompleted: pe.puzzlesCompleted,
        score: pe.score,
      }));

    return speedLeaderboard;
  }

  /**
   * Get global leaderboard across all events
   */
  async getGlobalLeaderboard(
    limit: number = 10,
  ): Promise<Array<{
    rank: number;
    playerId: string;
    totalScore: number;
    eventsParticipated: number;
    totalPuzzlesCompleted: number;
  }>> {
    const playerEvents = await this.playerEventRepository.find();

    // Aggregate by player
    const playerStats = new Map<
      string,
      {
        totalScore: number;
        eventsParticipated: number;
        totalPuzzlesCompleted: number;
      }
    >();

    for (const pe of playerEvents) {
      const existing = playerStats.get(pe.playerId) || {
        totalScore: 0,
        eventsParticipated: 0,
        totalPuzzlesCompleted: 0,
      };

      playerStats.set(pe.playerId, {
        totalScore: existing.totalScore + pe.score,
        eventsParticipated: existing.eventsParticipated + 1,
        totalPuzzlesCompleted: existing.totalPuzzlesCompleted + pe.puzzlesCompleted,
      });
    }

    // Convert to array and sort
    const leaderboard = Array.from(playerStats.entries())
      .map(([playerId, stats]) => ({
        playerId,
        ...stats,
      }))
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return b.totalPuzzlesCompleted - a.totalPuzzlesCompleted;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return leaderboard;
  }
}
