import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSessionPlayer } from '../entities/puzzle-session-player.entity';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';

@Injectable()
export class PuzzleSessionPlayerService {
  constructor(
    @InjectRepository(PuzzleSessionPlayer)
    private readonly repository: Repository<PuzzleSessionPlayer>,
  ) {}

  async join(
    sessionId: string,
    userId: string,
    role: PuzzlePlayerRole = PuzzlePlayerRole.CONTRIBUTOR,
  ) {
    const existing = await this.repository.findOne({
      where: { sessionId, userId },
    });

    if (existing) {
      existing.status = PuzzlePlayerStatus.CONNECTED;
      existing.lastSeenAt = new Date();
      existing.leftAt = null;
      return this.repository.save(existing);
    }

    try {
      return await this.repository.save(
        this.repository.create({
          sessionId,
          userId,
          status: PuzzlePlayerStatus.CONNECTED,
          role,
          score: 0,
          progress: 0,
          contributions: 0,
          contributionPoints: 0,
          joinedAt: new Date(),
          lastSeenAt: new Date(),
          leftAt: null,
        }),
      );
    } catch {
      throw new ConflictException('Unable to join puzzle session');
    }
  }

  async leave(sessionId: string, userId: string) {
    const player = await this.find(sessionId, userId);
    player.status = PuzzlePlayerStatus.LEFT;
    player.leftAt = new Date();
    player.lastSeenAt = new Date();
    return this.repository.save(player);
  }

  async disconnect(sessionId: string, userId: string) {
    const player = await this.find(sessionId, userId);
    player.status = PuzzlePlayerStatus.DISCONNECTED;
    player.lastSeenAt = new Date();
    return this.repository.save(player);
  }

  async reconnect(sessionId: string, userId: string) {
    const player = await this.find(sessionId, userId);
    player.status = PuzzlePlayerStatus.CONNECTED;
    player.lastSeenAt = new Date();
    return this.repository.save(player);
  }

  async list(sessionId: string) {
    return this.repository.find({
      where: { sessionId },
      order: { joinedAt: 'ASC' },
    });
  }

  async countActive(sessionId: string) {
    return this.repository.count({
      where: [
        { sessionId, status: PuzzlePlayerStatus.CONNECTED },
        { sessionId, status: PuzzlePlayerStatus.DISCONNECTED },
      ],
    });
  }

  /**
   * Assign a co-operative role. Leadership transfer is handled by the session
   * service, which demotes the previous leader first.
   */
  async assignRole(
    sessionId: string,
    userId: string,
    role: PuzzlePlayerRole,
  ) {
    const player = await this.find(sessionId, userId);
    player.role = role;
    player.lastSeenAt = new Date();
    return this.repository.save(player);
  }

  async getRole(
    sessionId: string,
    userId: string,
  ): Promise<PuzzlePlayerRole | null> {
    const player = await this.repository.findOne({
      where: { sessionId, userId },
    });
    return player?.role ?? null;
  }

  /**
   * Credit a correct solution to a player. Contributions are the raw count,
   * contribution points weight them (a correct step is worth more than a
   * partial edit) and are what the team leaderboard sorts by.
   */
  async recordContribution(
    sessionId: string,
    userId: string,
    points = 10,
  ) {
    const player = await this.find(sessionId, userId);
    player.contributions = (player.contributions ?? 0) + 1;
    player.contributionPoints =
      (player.contributionPoints ?? 0) + Math.max(0, points);
    player.lastContributionAt = new Date();
    player.lastSeenAt = new Date();
    return this.repository.save(player);
  }

  async getContributions(sessionId: string) {
    const players = await this.list(sessionId);
    const totalPoints = players.reduce(
      (sum, player) => sum + (player.contributionPoints ?? 0),
      0,
    );

    return players
      .map((player) => ({
        userId: player.userId,
        role: player.role,
        contributions: player.contributions ?? 0,
        contributionPoints: player.contributionPoints ?? 0,
        share:
          totalPoints === 0
            ? 0
            : (player.contributionPoints ?? 0) / totalPoints,
        lastContributionAt: player.lastContributionAt ?? null,
      }))
      .sort((a, b) => b.contributionPoints - a.contributionPoints);
  }

  async getActivePlayers(sessionId: string) {
    const players = await this.list(sessionId);
    return players.filter(
      (player) => player.status !== PuzzlePlayerStatus.LEFT,
    );
  }

  private async find(sessionId: string, userId: string) {
    const player = await this.repository.findOne({
      where: { sessionId, userId },
    });
    if (!player)
      throw new NotFoundException('Player is not part of this session');
    return player;
  }
}
