// services/game-session.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GameSession } from '../entities/game-session.entity';
import { PlayerEventsService } from '../../player-events/player-events.service';
import { PuzzleVersionService } from '../../puzzles/services/puzzle-version.service';
import { CacheService } from '../../cache/services/cache.service';

const SUSPENDED_KEY = (id: string) => `session:suspended:${id}`;
const graceWindowSecs = () =>
  parseInt(process.env.SESSION_GRACE_WINDOW_SECONDS ?? '300', 10);

@Injectable()
export class GameSessionService {
  constructor(
    @InjectRepository(GameSession)
    private readonly sessionRepo: Repository<GameSession>,
    private readonly playerEventsService: PlayerEventsService,
    private readonly puzzleVersionService: PuzzleVersionService,
    private readonly cacheService: CacheService,
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

    return savedSession;
  }

  async getActiveSessions() {
    return this.sessionRepo.find({ where: { status: 'IN_PROGRESS' } });
  }

  async getById(sessionId: string) {
    return this.sessionRepo.findOne({ where: { id: sessionId } });
  }

  async suspend(sessionId: string) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');

    session.status = 'SUSPENDED';
    session.suspendedAt = new Date();
    session.lastActiveAt = new Date();
    const saved = await this.sessionRepo.save(session);

    // Snapshot full state to Redis so reconnect can restore it exactly
    const ttl = graceWindowSecs() + 60; // small buffer beyond the grace window
    await this.cacheService.set(SUSPENDED_KEY(sessionId), saved.state, { ttl });

    return saved;
  }

  async resumeById(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException('Session does not belong to this user');
    if (session.status !== 'SUSPENDED') throw new ForbiddenException('Session is not suspended');

    const cutoff = new Date(Date.now() - graceWindowSecs() * 1000);
    if (session.suspendedAt && session.suspendedAt < cutoff) {
      throw new ForbiddenException('Grace window has expired — session cannot be resumed');
    }

    // Restore state from Redis snapshot (falls back to DB state if cache miss)
    const snapshot = await this.cacheService.get<Record<string, any>>(SUSPENDED_KEY(sessionId));
    if (snapshot) {
      session.state = snapshot;
      await this.cacheService.delete(SUSPENDED_KEY(sessionId));
    }

    session.status = 'IN_PROGRESS';
    session.suspendedAt = null;
    session.lastActiveAt = new Date();
    return this.sessionRepo.save(session);
  }

  async getSuspendedSessions(userId: string) {
    return this.sessionRepo.find({ where: { userId, status: 'SUSPENDED' } });
  }
}
