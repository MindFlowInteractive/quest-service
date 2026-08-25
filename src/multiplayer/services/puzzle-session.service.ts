import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSession } from '../entities/puzzle-session.entity';
import { PuzzleSessionSolution } from '../entities/puzzle-session-solution.entity';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';
import { PuzzleSessionPlayerService } from './puzzle-session-player.service';
import { PuzzleSessionStateService } from './puzzle-session-state.service';
import { PuzzleSessionPersistenceService } from './puzzle-session-persistence.service';
import { PuzzleSessionTimeoutService } from './puzzle-session-timeout.service';
import { CreatePuzzleSessionDto } from '../dto/create-puzzle-session.dto';
import { SubmitSolutionDto } from '../dto/submit-solution.dto';
import { UpdatePartialSolutionDto } from '../dto/update-solution.dto';

@Injectable()
export class PuzzleSessionService {
  constructor(
    @InjectRepository(PuzzleSession)
    private readonly sessionRepository: Repository<PuzzleSession>,
    @InjectRepository(PuzzleSessionSolution)
    private readonly solutionRepository: Repository<PuzzleSessionSolution>,
    private readonly playerService: PuzzleSessionPlayerService,
    private readonly stateService: PuzzleSessionStateService,
    private readonly persistence: PuzzleSessionPersistenceService,
    private readonly timeoutService: PuzzleSessionTimeoutService,
  ) {}

  async create(dto: CreatePuzzleSessionDto, userId: string) {
    const expiresAt = new Date(Date.now() + dto.durationSeconds * 1000);

    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        puzzleId: dto.puzzleId,
        maxPlayers: dto.maxPlayers,
        status: PuzzleSessionStatus.WAITING,
        expiresAt,
      }),
    );

    await this.stateService.create(session.id, session.puzzleId);
    await this.persistence.recordEvent(
      session.id,
      PuzzleSessionEventType.SESSION_CREATED,
      userId,
      { puzzleId: session.puzzleId },
    );

    await this.join(session.id, userId);
    await this.timeoutService.schedule(
      session.id,
      expiresAt.getTime() - Date.now(),
    );

    return this.getState(session.id);
  }

  async get(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Puzzle session not found');
    return session;
  }

  async getState(sessionId: string) {
    const state = await this.stateService.get(sessionId);
    if (state) return state;

    const session = await this.get(sessionId);
    return this.stateService.create(
      session.id,
      session.puzzleId,
      session.status,
    );
  }

  async join(sessionId: string, userId: string) {
    const session = await this.get(sessionId);

    if (
      session.status === PuzzleSessionStatus.COMPLETED ||
      session.status === PuzzleSessionStatus.EXPIRED ||
      session.status === PuzzleSessionStatus.CANCELLED
    ) {
      throw new ConflictException('Session is no longer accepting players');
    }

    const count = await this.playerService.countActive(sessionId);
    const existingState = await this.getState(sessionId);
    const alreadyPresent = Boolean(existingState.players[userId]);

    if (!alreadyPresent && count >= session.maxPlayers) {
      throw new ConflictException('Puzzle session is full');
    }

    const player = await this.playerService.join(sessionId, userId);

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        current.players[userId] = {
          userId,
          status: player.status,
          connected: true,
          score: player.score,
          progress: player.progress,
        };
        if (current.status === PuzzleSessionStatus.WAITING) {
          current.status = PuzzleSessionStatus.ACTIVE;
        }
      },
    );

    if (session.status === PuzzleSessionStatus.WAITING) {
      session.status = PuzzleSessionStatus.ACTIVE;
      session.startedAt = new Date();
      await this.sessionRepository.save(session);
      await this.persistence.recordEvent(
        sessionId,
        PuzzleSessionEventType.SESSION_STARTED,
        userId,
      );
    }

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PLAYER_JOINED,
      userId,
    );

    return state;
  }

  async leave(sessionId: string, userId: string) {
    await this.playerService.leave(sessionId, userId);

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        if (current.players[userId]) {
          current.players[userId].status = 'LEFT' as any;
          current.players[userId].connected = false;
        }
      },
    );

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PLAYER_LEFT,
      userId,
    );

    return state;
  }

  async disconnect(sessionId: string, userId: string) {
    await this.playerService.disconnect(sessionId, userId);
    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        if (current.players[userId]) {
          current.players[userId].status = 'DISCONNECTED' as any;
          current.players[userId].connected = false;
        }
      },
    );
    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PLAYER_DISCONNECTED,
      userId,
    );
    return state;
  }

  async reconnect(sessionId: string, userId: string) {
    const player = await this.playerService.reconnect(sessionId, userId);
    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        current.players[userId] = {
          userId,
          status: player.status,
          connected: true,
          score: player.score,
          progress: player.progress,
        };
      },
    );
    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PLAYER_RECONNECTED,
      userId,
    );
    return state;
  }

  async updatePartialSolution(dto: UpdatePartialSolutionDto, userId: string) {
    const state = await this.assertActive(
      dto.sessionId,
      userId,
      dto.clientVersion,
    );

    const updated = await this.stateService.mutate(
      dto.sessionId,
      state.version,
      (current) => {
        current.partialSolutions[userId] = {
          userId,
          content: dto.content,
          ...(dto.stepId ? { stepId: dto.stepId } : {}),
          ...(dto.confidence !== undefined
            ? { confidence: dto.confidence }
            : {}),
          updatedAt: new Date().toISOString(),
        };
      },
    );

    await this.persistence.recordEvent(
      dto.sessionId,
      PuzzleSessionEventType.PARTIAL_SOLUTION_UPDATED,
      userId,
      { stepId: dto.stepId },
    );

    return updated;
  }

  async submitSolution(dto: SubmitSolutionDto, userId: string) {
    const state = await this.assertActive(
      dto.sessionId,
      userId,
      dto.clientVersion,
    );

    // Replace this deterministic placeholder with the repository's puzzle validation service.
    const correct = dto.content.trim().length > 0;

    await this.solutionRepository.save(
      this.solutionRepository.create({
        sessionId: dto.sessionId,
        userId,
        stepId: dto.stepId ?? null,
        content: dto.content,
        confidence: dto.confidence ?? null,
        isCorrect: correct,
      }),
    );

    const updated = await this.stateService.mutate(
      dto.sessionId,
      state.version,
      (current) => {
        if (
          dto.stepId &&
          correct &&
          !current.sharedProgress.solvedSteps.includes(dto.stepId)
        ) {
          current.sharedProgress.solvedSteps.push(dto.stepId);
        }
        current.players[userId].score += correct ? 1 : 0;
        current.players[userId].progress = Math.min(
          100,
          current.players[userId].progress + (correct ? 10 : 0),
        );
      },
    );

    await this.persistence.recordEvent(
      dto.sessionId,
      PuzzleSessionEventType.SOLUTION_SUBMITTED,
      userId,
      { correct, stepId: dto.stepId },
    );

    return { correct, state: updated };
  }

  async complete(sessionId: string, userId: string) {
    await this.get(sessionId);

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        current.status = PuzzleSessionStatus.COMPLETED;
      },
    );

    const session = await this.get(sessionId);
    session.status = PuzzleSessionStatus.COMPLETED;
    session.completedAt = new Date();
    await this.sessionRepository.save(session);
    await this.timeoutService.cancel(sessionId);

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PUZZLE_COMPLETED,
      userId,
    );

    return state;
  }

  async expire(sessionId: string) {
    const session = await this.get(sessionId);

    if (
      session.status === PuzzleSessionStatus.COMPLETED ||
      session.status === PuzzleSessionStatus.EXPIRED ||
      session.status === PuzzleSessionStatus.CANCELLED
    ) {
      return this.getState(sessionId);
    }

    session.status = PuzzleSessionStatus.EXPIRED;
    await this.sessionRepository.save(session);

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        current.status = PuzzleSessionStatus.EXPIRED;
      },
    );

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.SESSION_EXPIRED,
    );

    return state;
  }

  async history(sessionId: string, limit = 50, offset = 0) {
    await this.get(sessionId);
    return this.persistence.history(sessionId, limit, offset);
  }

  private async assertActive(
    sessionId: string,
    userId: string,
    clientVersion?: number,
  ) {
    const session = await this.get(sessionId);
    if (session.status !== PuzzleSessionStatus.ACTIVE) {
      throw new BadRequestException('Puzzle session is not active');
    }

    const state = await this.getState(sessionId);
    if (!state.players[userId] || !state.players[userId].connected) {
      throw new BadRequestException('Player is not connected to this session');
    }

    if (clientVersion !== undefined && clientVersion !== state.version) {
      throw new ConflictException({
        code: 'STALE_SESSION_STATE',
        currentVersion: state.version,
      });
    }

    return state;
  }
}
