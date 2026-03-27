import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Spectator } from '../entities/spectator.entity';
import { GameSession } from '../entities/game-session.entity';
import { SpectateSessionDto } from '../dto/spectate-session.dto';

@Injectable()
export class SpectatorService {
  constructor(
    @InjectRepository(Spectator)
    private readonly spectatorRepo: Repository<Spectator>,
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
  ) {}

  async joinSession(sessionId: string, dto: SpectateSessionDto): Promise<Spectator> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!session.isSpectatorAllowed) {
      throw new ForbiddenException('Spectating is not allowed for this session');
    }

    // Check if user is already spectating
    const existingSpectator = await this.spectatorRepo.findOne({
      where: { sessionId, userId: dto.userId, isActive: true },
    });

    if (existingSpectator) {
      return existingSpectator;
    }

    const spectator = this.spectatorRepo.create({
      userId: dto.userId,
      username: dto.username,
      sessionId,
      joinedAt: new Date(),
      isActive: true,
    });

    return this.spectatorRepo.save(spectator);
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const spectator = await this.spectatorRepo.findOne({
      where: { sessionId, userId, isActive: true },
    });

    if (!spectator) {
      throw new NotFoundException('Not currently spectating this session');
    }

    spectator.isActive = false;
    spectator.leftAt = new Date();
    await this.spectatorRepo.save(spectator);
  }

  async getActiveSpectators(sessionId: string): Promise<Spectator[]> {
    return this.spectatorRepo.find({
      where: { sessionId, isActive: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async getSpectatorCount(sessionId: string): Promise<number> {
    return this.spectatorRepo.count({
      where: { sessionId, isActive: true },
    });
  }

  async toggleSpectating(sessionId: string, userId: string, spectatingAllowed: boolean): Promise<GameSession> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Only session owner can toggle spectating');
    }

    session.isSpectatorAllowed = spectatingAllowed;
    
    // If disabling spectating, remove all active spectators
    if (!spectatingAllowed) {
      await this.spectatorRepo.update(
        { sessionId, isActive: true },
        { isActive: false, leftAt: new Date() }
      );
    }

    return this.sessionRepo.save(session);
  }

  async isUserSpectating(sessionId: string, userId: string): Promise<boolean> {
    const spectator = await this.spectatorRepo.findOne({
      where: { sessionId, userId, isActive: true },
    });
    return !!spectator;
  }
}
