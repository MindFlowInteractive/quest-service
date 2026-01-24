import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session, SessionStatus } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';
import { RedisCacheService } from './redis-cache.service';

export interface CreateSessionDto {
  userId: string;
  puzzleId?: string;
  metadata?: Record<string, any>;
  timeoutAfter?: number; // seconds
}

export interface UpdateSessionDto {
  status?: SessionStatus;
  puzzleId?: string;
  totalMoves?: number;
  totalScore?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly redisCache: RedisCacheService,
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    const sessionId = uuidv4();
    const now = new Date();

    const session = this.sessionRepository.create({
      sessionId,
      userId: dto.userId,
      puzzleId: dto.puzzleId,
      status: SessionStatus.ACTIVE,
      startTime: now,
      lastActiveAt: now,
      duration: 0,
      totalMoves: 0,
      totalScore: 0,
      metadata: dto.metadata || {},
      timeoutAfter: dto.timeoutAfter,
      timeoutAt: dto.timeoutAfter
        ? new Date(now.getTime() + dto.timeoutAfter * 1000)
        : undefined,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Cache session in Redis
    await this.redisCache.setSession(savedSession);

    this.logger.log(`Session created: ${sessionId} for user: ${dto.userId}`);
    return savedSession;
  }

  async findById(sessionId: string): Promise<Session> {
    // Try Redis cache first
    const cached = await this.redisCache.getSession(sessionId);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const session = await this.sessionRepository.findOne({
      where: { sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    // Cache for future requests
    await this.redisCache.setSession(session);
    return session;
  }

  async findByUserId(userId: string, status?: SessionStatus): Promise<Session[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.sessionRepository.find({
      where,
      order: { lastActiveAt: 'DESC' },
    });
  }

  async getActiveSession(userId: string): Promise<Session | null> {
    // Try Redis cache first
    const cached = await this.redisCache.getActiveSession(userId);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const session = await this.sessionRepository.findOne({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      order: { lastActiveAt: 'DESC' },
    });

    if (session) {
      await this.redisCache.setSession(session);
    }

    return session;
  }

  async update(sessionId: string, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.findById(sessionId);

    if (dto.status) {
      session.status = dto.status;
      if (
        dto.status === SessionStatus.COMPLETED ||
        dto.status === SessionStatus.ABANDONED ||
        dto.status === SessionStatus.TIMEOUT
      ) {
        session.endTime = new Date();
        session.duration = Math.floor(
          (session.endTime.getTime() - session.startTime.getTime()) / 1000,
        );
      }
    }

    if (dto.puzzleId !== undefined) {
      session.puzzleId = dto.puzzleId;
    }

    if (dto.totalMoves !== undefined) {
      session.totalMoves = dto.totalMoves;
    }

    if (dto.totalScore !== undefined) {
      session.totalScore = dto.totalScore;
    }

    if (dto.metadata) {
      session.metadata = { ...session.metadata, ...dto.metadata };
    }

    session.lastActiveAt = new Date();

    const updated = await this.sessionRepository.save(session);
    await this.redisCache.setSession(updated);

    this.logger.debug(`Session updated: ${sessionId}`);
    return updated;
  }

  async updateLastActive(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);
    session.lastActiveAt = new Date();
    await this.sessionRepository.save(session);
    await this.redisCache.setSession(session);
  }

  async pause(sessionId: string): Promise<Session> {
    return this.update(sessionId, { status: SessionStatus.PAUSED });
  }

  async resume(sessionId: string): Promise<Session> {
    const session = await this.findById(sessionId);
    if (session.status !== SessionStatus.PAUSED) {
      throw new BadRequestException(
        `Cannot resume session with status: ${session.status}`,
      );
    }
    return this.update(sessionId, { status: SessionStatus.ACTIVE });
  }

  async complete(sessionId: string): Promise<Session> {
    return this.update(sessionId, { status: SessionStatus.COMPLETED });
  }

  async abandon(sessionId: string): Promise<Session> {
    return this.update(sessionId, { status: SessionStatus.ABANDONED });
  }

  async timeout(sessionId: string): Promise<Session> {
    return this.update(sessionId, { status: SessionStatus.TIMEOUT });
  }

  async delete(sessionId: string): Promise<void> {
    const session = await this.findById(sessionId);
    await this.sessionRepository.remove(session);
    await this.redisCache.deleteSession(sessionId);
    this.logger.log(`Session deleted: ${sessionId}`);
  }

  async getExpiredSessions(): Promise<Session[]> {
    const now = new Date();
    return this.sessionRepository.find({
      where: [
        {
          status: SessionStatus.ACTIVE,
          timeoutAt: LessThan(now),
        },
        {
          status: SessionStatus.PAUSED,
          timeoutAt: LessThan(now),
        },
      ],
    });
  }

  async getInactiveSessions(inactiveThresholdSeconds: number): Promise<Session[]> {
    const threshold = new Date(
      Date.now() - inactiveThresholdSeconds * 1000,
    );
    return this.sessionRepository.find({
      where: {
        status: SessionStatus.ACTIVE,
        lastActiveAt: LessThan(threshold),
      },
    });
  }
}
