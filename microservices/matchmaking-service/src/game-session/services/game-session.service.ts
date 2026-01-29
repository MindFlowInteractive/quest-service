// services/game-session.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';

@Injectable()
export class GameSessionService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
  ) {}

  async create(userId: string) {
    const session = this.sessionRepo.create({
      userId,
      status: 'IN_PROGRESS',
      state: {},
      lastActiveAt: new Date(),
    });
    return this.sessionRepo.save(session);
  }

  async updateState(sessionId: string, partialState: Record<string, any>) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    session.state = { ...session.state, ...partialState };
    session.lastActiveAt = new Date();

    return this.sessionRepo.save(session);
  }

  async resume(userId: string) {
    return this.sessionRepo.findOne({
      where: { userId, status: 'IN_PROGRESS' },
    });
  }

  async end(sessionId: string, status: 'COMPLETED' | 'ABANDONED') {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    session.status = status;
    session.lastActiveAt = new Date();

    return this.sessionRepo.save(session);
  }

  async getActiveSessions() {
    return this.sessionRepo.find({ where: { status: 'IN_PROGRESS' } });
  }
}
