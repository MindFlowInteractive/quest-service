import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSessionPlayer } from '../entities/puzzle-session-player.entity';
import { PuzzlePlayerStatus } from '../enums/puzzle-player-status.enum';

@Injectable()
export class PuzzleSessionPlayerService {
  constructor(
    @InjectRepository(PuzzleSessionPlayer)
    private readonly repository: Repository<PuzzleSessionPlayer>,
  ) {}

  async join(sessionId: string, userId: string) {
    const existing = await this.repository.findOne({
      where: { sessionId, userId },
    });

    if (existing && existing.status !== PuzzlePlayerStatus.LEFT) {
      existing.status = PuzzlePlayerStatus.CONNECTED;
      existing.lastSeenAt = new Date();
      existing.leftAt = null;
      return this.repository.save(existing);
    }

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
          score: 0,
          progress: 0,
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

  private async find(sessionId: string, userId: string) {
    const player = await this.repository.findOne({
      where: { sessionId, userId },
    });
    if (!player)
      throw new NotFoundException('Player is not part of this session');
    return player;
  }
}
