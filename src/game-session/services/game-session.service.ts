// services/game-session.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';
import { PlayerEventsService } from '../../player-events/player-events.service';
import { PuzzleVersionService } from '../../puzzles/services/puzzle-version.service';
import { WEBHOOK_INTERNAL_EVENTS } from '../../webhooks/webhook.constants';

@Injectable()
export class GameSessionService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    private readonly playerEventsService: PlayerEventsService,
    private readonly puzzleVersionService: PuzzleVersionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, puzzleId?: string) {
    // Resolve the current puzzle version id (if a puzzle is specified)
    let puzzleVersionId: string | undefined;
    if (puzzleId) {
      puzzleVersionId = (await this.puzzleVersionService.getCurrentVersionId(puzzleId)) ?? undefined;
    }

    const session = this.sessionRepo.create({
      userId,
      puzzleId,
      puzzleVersionId,
      status: 'IN_PROGRESS',
      state: {},
      lastActiveAt: new Date(),
    });
    const savedSession = await this.sessionRepo.save(session);

    await this.playerEventsService.emitPlayerEvent({
      userId,
      sessionId: savedSession.id,
      eventType: 'puzzle.started',
      payload: {
        sessionId: savedSession.id,
        startedAt: savedSession.createdAt || new Date(),
      },
    });

    return savedSession;
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

    const savedSession = await this.sessionRepo.save(session);

    if (status === 'ABANDONED') {
      await this.playerEventsService.emitPlayerEvent({
        userId: savedSession.userId,
        sessionId: savedSession.id,
        eventType: 'puzzle.abandoned',
        payload: {
          sessionId: savedSession.id,
          reason: 'session ended as abandoned',
          endedAt: savedSession.lastActiveAt,
        },
      });
    }

    this.eventEmitter.emit(WEBHOOK_INTERNAL_EVENTS.sessionEnded, {
      sessionId: savedSession.id,
      userId: savedSession.userId,
      puzzleId: savedSession.puzzleId,
      status: savedSession.status,
      endedAt: savedSession.lastActiveAt.toISOString(),
    });

    return savedSession;
  }

  async getActiveSessions() {
    return this.sessionRepo.find({ where: { status: 'IN_PROGRESS' } });
  }

  async getById(sessionId: string) {
    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }
}
