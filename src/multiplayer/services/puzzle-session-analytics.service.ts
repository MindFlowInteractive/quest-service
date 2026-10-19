import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSessionEvent } from '../entities/puzzle-session-event.entity';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';
import { PuzzleSessionPlayer } from '../entities/puzzle-session-player.entity';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';

@Injectable()
export class PuzzleSessionAnalyticsService {
  constructor(
    @InjectRepository(PuzzleSessionEvent)
    private readonly eventRepository: Repository<PuzzleSessionEvent>,
    @InjectRepository(PuzzleSessionPlayer)
    private readonly playerRepository: Repository<PuzzleSessionPlayer>,
  ) {}

  async get(sessionId: string) {
    const [events, players] = await Promise.all([
      this.eventRepository.find({ where: { sessionId } }),
      this.playerRepository.find({ where: { sessionId } }),
    ]);

    const created = events.find(
      (event) => event.type === PuzzleSessionEventType.SESSION_CREATED,
    );
    const completed = events.find(
      (event) => event.type === PuzzleSessionEventType.PUZZLE_COMPLETED,
    );

    const joinedUserIds = new Set(
      events
        .filter(
          (event) => event.type === PuzzleSessionEventType.PLAYER_JOINED,
        )
        .map((event) => event.userId)
        .filter((userId): userId is string => Boolean(userId)),
    );

    const totalContributions = players.reduce(
      (sum, player) => sum + (player.contributions ?? 0),
      0,
    );
    const totalContributionPoints = players.reduce(
      (sum, player) => sum + (player.contributionPoints ?? 0),
      0,
    );

    return {
      sessionId,
      playerCount: players.length,
      peakPlayers: Math.max(players.length, joinedUserIds.size),
      solutionsSubmitted: events.filter(
        (event) => event.type === PuzzleSessionEventType.SOLUTION_SUBMITTED,
      ).length,
      partialSolutions: events.filter(
        (event) =>
          event.type === PuzzleSessionEventType.PARTIAL_SOLUTION_UPDATED,
      ).length,
      hintsDiscovered: events.filter(
        (event) => event.type === PuzzleSessionEventType.HINT_DISCOVERED,
      ).length,
      messages: events.filter(
        (event) => event.type === PuzzleSessionEventType.MESSAGE_SENT,
      ).length,
      roleChanges: events.filter(
        (event) => event.type === PuzzleSessionEventType.ROLE_ASSIGNED,
      ).length,
      disconnects: events.filter(
        (event) => event.type === PuzzleSessionEventType.PLAYER_DISCONNECTED,
      ).length,
      reconnects: events.filter(
        (event) => event.type === PuzzleSessionEventType.PLAYER_RECONNECTED,
      ).length,
      completed: Boolean(completed),
      durationSeconds:
        created && completed
          ? Math.max(
              0,
              Math.floor(
                (completed.createdAt.getTime() - created.createdAt.getTime()) /
                  1000,
              ),
            )
          : null,
      roleDistribution: {
        [PuzzlePlayerRole.LEADER]: players.filter(
          (player) => player.role === PuzzlePlayerRole.LEADER,
        ).length,
        [PuzzlePlayerRole.CONTRIBUTOR]: players.filter(
          (player) => player.role === PuzzlePlayerRole.CONTRIBUTOR,
        ).length,
        [PuzzlePlayerRole.OBSERVER]: players.filter(
          (player) => player.role === PuzzlePlayerRole.OBSERVER,
        ).length,
      },
      totalContributions,
      totalContributionPoints,
      averageContributionsPerPlayer:
        players.length === 0 ? 0 : totalContributions / players.length,
      contributions: players
        .map((player) => ({
          userId: player.userId,
          role: player.role,
          contributions: player.contributions ?? 0,
          contributionPoints: player.contributionPoints ?? 0,
          share:
            totalContributionPoints === 0
              ? 0
              : (player.contributionPoints ?? 0) / totalContributionPoints,
        }))
        .sort((a, b) => b.contributionPoints - a.contributionPoints),
    };
  }

  /**
   * Aggregate co-op health across many sessions: average team size, share of
   * sessions that actually completed, and the average contribution spread.
   * Used by the dashboard endpoint for the multiplayer section.
   */
  async getOverview(sessionIds: string[]) {
    const sessions = await Promise.all(
      sessionIds.map((sessionId) => this.get(sessionId)),
    );

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (session) => session.completed,
    ).length;
    const totalPlayers = sessions.reduce(
      (sum, session) => sum + session.playerCount,
      0,
    );

    return {
      totalSessions,
      completedSessions,
      completionRate:
        totalSessions === 0 ? 0 : completedSessions / totalSessions,
      averageTeamSize: totalSessions === 0 ? 0 : totalPlayers / totalSessions,
      averageMessages:
        totalSessions === 0
          ? 0
          : sessions.reduce((sum, session) => sum + session.messages, 0) /
            totalSessions,
      sessions,
    };
  }
}
