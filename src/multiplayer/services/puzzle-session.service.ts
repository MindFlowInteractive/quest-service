import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSession } from '../entities/puzzle-session.entity';
import { PuzzleSessionSolution } from '../entities/puzzle-session-solution.entity';
import { PuzzleSessionMessage } from '../entities/puzzle-session-message.entity';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';
import { PuzzleSessionPlayerService } from './puzzle-session-player.service';
import { PuzzleSessionStateService } from './puzzle-session-state.service';
import { PuzzleSessionPersistenceService } from './puzzle-session-persistence.service';
import { PuzzleSessionTimeoutService } from './puzzle-session-timeout.service';
import { CreatePuzzleSessionDto } from '../dto/create-puzzle-session.dto';
import { SubmitSolutionDto } from '../dto/submit-solution.dto';
import { UpdatePartialSolutionDto } from '../dto/update-solution.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { evaluateWinCondition } from '../utils/puzzle-session-win-condition';

@Injectable()
export class PuzzleSessionService {
  constructor(
    @InjectRepository(PuzzleSession)
    private readonly sessionRepository: Repository<PuzzleSession>,
    @InjectRepository(PuzzleSessionSolution)
    private readonly solutionRepository: Repository<PuzzleSessionSolution>,
    @InjectRepository(PuzzleSessionMessage)
    private readonly messageRepository: Repository<PuzzleSessionMessage>,
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
        requiredSolvedSteps: dto.requiredSolvedSteps ?? [],
        minContributors: dto.minContributors ?? 1,
        requireAllPlayers: dto.requireAllPlayers ?? false,
      }),
    );

    await this.stateService.create(session.id, session.puzzleId);
    await this.persistence.recordEvent(
      session.id,
      PuzzleSessionEventType.SESSION_CREATED,
      userId,
      {
        puzzleId: session.puzzleId,
        requiredSolvedSteps: session.requiredSolvedSteps,
        minContributors: session.minContributors,
        requireAllPlayers: session.requireAllPlayers,
      },
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

    // The first active player becomes the leader. Later joiners keep the
    // default contributor role assigned by the player service.
    const activePlayers = await this.playerService.getActivePlayers(sessionId);
    const hasLeader = activePlayers.some(
      (candidate) => candidate.role === PuzzlePlayerRole.LEADER,
    );
    const joined = hasLeader
      ? player
      : await this.playerService.assignRole(
          sessionId,
          userId,
          PuzzlePlayerRole.LEADER,
        );

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        current.players[userId] = {
          userId,
          status: joined.status,
          connected: true,
          score: joined.score,
          progress: joined.progress,
          role: joined.role ?? PuzzlePlayerRole.CONTRIBUTOR,
          contributions: joined.contributions ?? 0,
          contributionPoints: joined.contributionPoints ?? 0,
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

    // If the leader left, promote the earliest remaining player.
    const promoted = await this.ensureLeader(sessionId);

    const state = await this.stateService.mutate(
      sessionId,
      undefined,
      (current) => {
        if (current.players[userId]) {
          current.players[userId].status = 'LEFT' as any;
          current.players[userId].connected = false;
        }
        if (promoted && current.players[promoted.userId]) {
          current.players[promoted.userId].role = PuzzlePlayerRole.LEADER;
        }
      },
    );

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.PLAYER_LEFT,
      userId,
      promoted ? { promotedLeader: promoted.userId } : undefined,
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
          role: player.role ?? PuzzlePlayerRole.CONTRIBUTOR,
          contributions: player.contributions ?? 0,
          contributionPoints: player.contributionPoints ?? 0,
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

    if (state.players[userId]?.role === PuzzlePlayerRole.OBSERVER) {
      throw new ForbiddenException('Observers cannot submit solutions');
    }

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
        const player = current.players[userId];
        const shared = current.sharedProgress;
        shared.stepContributors = shared.stepContributors ?? {};

        if (dto.stepId && correct && !shared.solvedSteps.includes(dto.stepId)) {
          shared.solvedSteps.push(dto.stepId);
          shared.stepContributors[dto.stepId] = userId;
        }

        if (player) {
          player.score += correct ? 1 : 0;
          player.progress = Math.min(
            100,
            player.progress + (correct ? 10 : 0),
          );
          player.contributions =
            (player.contributions ?? 0) + (correct ? 1 : 0);
          player.contributionPoints =
            (player.contributionPoints ?? 0) + (correct ? 10 : 0);
        }
      },
    );

    if (correct) {
      await this.playerService.recordContribution(dto.sessionId, userId, 10);
    }

    await this.persistence.recordEvent(
      dto.sessionId,
      PuzzleSessionEventType.SOLUTION_SUBMITTED,
      userId,
      {
        correct,
        stepId: dto.stepId,
        contributions: updated.players[userId]?.contributions ?? 0,
      },
    );

    // Auto-complete the session as soon as the declared team win condition is
    // met. Sessions without a condition keep the manual completion flow.
    const session = await this.get(dto.sessionId);
    const winCondition = evaluateWinCondition(updated, {
      requiredSolvedSteps: session.requiredSolvedSteps ?? [],
      minContributors: session.minContributors ?? 1,
      requireAllPlayers: session.requireAllPlayers ?? false,
    });

    let completed = false;
    let finalState = updated;
    if (
      winCondition.satisfied &&
      session.status === PuzzleSessionStatus.ACTIVE
    ) {
      finalState = await this.complete(dto.sessionId, userId);
      completed = true;
    }

    return {
      correct,
      state: finalState,
      completed,
      winCondition,
    };
  }

  /**
   * Assign (or transfer) a co-operative role. Only the current leader may do
   * this; assigning LEADER demotes the previous leader to contributor.
   */
  async assignRole(dto: AssignRoleDto, actorId: string) {
    const state = await this.assertActive(dto.sessionId, actorId);
    const players = await this.playerService.getActivePlayers(dto.sessionId);
    const actor = players.find((player) => player.userId === actorId);

    if (!actor || actor.role !== PuzzlePlayerRole.LEADER) {
      throw new ForbiddenException('Only the session leader can assign roles');
    }

    const target = players.find(
      (player) => player.userId === dto.targetUserId,
    );
    if (!target) {
      throw new NotFoundException('Player is not part of this session');
    }

    if (dto.role === PuzzlePlayerRole.LEADER) {
      const previousLeaders = players.filter(
        (player) =>
          player.role === PuzzlePlayerRole.LEADER &&
          player.userId !== dto.targetUserId,
      );
      for (const leader of previousLeaders) {
        await this.playerService.assignRole(
          dto.sessionId,
          leader.userId,
          PuzzlePlayerRole.CONTRIBUTOR,
        );
      }
    }

    const player = await this.playerService.assignRole(
      dto.sessionId,
      dto.targetUserId,
      dto.role,
    );

    const updated = await this.stateService.mutate(
      dto.sessionId,
      state.version,
      (current) => {
        if (dto.role === PuzzlePlayerRole.LEADER) {
          for (const candidate of Object.values(current.players)) {
            if (candidate.userId !== dto.targetUserId) {
              candidate.role = PuzzlePlayerRole.CONTRIBUTOR;
            }
          }
        }
        if (current.players[dto.targetUserId]) {
          current.players[dto.targetUserId].role = dto.role;
        }
      },
    );

    await this.persistence.recordEvent(
      dto.sessionId,
      PuzzleSessionEventType.ROLE_ASSIGNED,
      actorId,
      { targetUserId: dto.targetUserId, role: dto.role },
    );

    return { player, state: updated };
  }

  /**
   * Post a chat message to the team. Messages are persisted so reconnecting
   * players can catch up.
   */
  async sendMessage(dto: SendMessageDto, userId: string) {
    await this.get(dto.sessionId);
    const state = await this.getState(dto.sessionId);

    if (!state.players[userId]) {
      throw new BadRequestException('Player is not part of this session');
    }

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('Message cannot be empty');
    }

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        sessionId: dto.sessionId,
        userId,
        content,
        type: dto.type === 'system' ? 'system' : 'chat',
      }),
    );

    await this.persistence.recordEvent(
      dto.sessionId,
      PuzzleSessionEventType.MESSAGE_SENT,
      userId,
      { messageId: message.id, type: message.type },
    );

    return message;
  }

  async getMessages(sessionId: string, limit = 50, offset = 0) {
    await this.get(sessionId);
    return this.messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(Number(limit) || 50, 1), 200),
      skip: Math.max(Number(offset) || 0, 0),
    });
  }

  /**
   * Per-player contribution leaderboard for the session.
   */
  async getContributions(sessionId: string) {
    await this.get(sessionId);
    const players = await this.playerService.getContributions(sessionId);

    return {
      sessionId,
      totalContributions: players.reduce(
        (sum, player) => sum + player.contributions,
        0,
      ),
      totalPoints: players.reduce(
        (sum, player) => sum + player.contributionPoints,
        0,
      ),
      players,
    };
  }

  /**
   * Current progress towards the team win condition.
   */
  async getWinConditionProgress(sessionId: string) {
    const [session, state] = await Promise.all([
      this.get(sessionId),
      this.getState(sessionId),
    ]);

    return evaluateWinCondition(state, {
      requiredSolvedSteps: session.requiredSolvedSteps ?? [],
      minContributors: session.minContributors ?? 1,
      requireAllPlayers: session.requireAllPlayers ?? false,
    });
  }

  /**
   * Share a discovered hint with the whole team.
   */
  async discoverHint(sessionId: string, userId: string, hintId: string) {
    const state = await this.assertActive(sessionId, userId);

    const updated = await this.stateService.mutate(
      sessionId,
      state.version,
      (current) => {
        current.sharedProgress.discoveredHints =
          current.sharedProgress.discoveredHints ?? [];
        if (!current.sharedProgress.discoveredHints.includes(hintId)) {
          current.sharedProgress.discoveredHints.push(hintId);
        }
      },
    );

    await this.persistence.recordEvent(
      sessionId,
      PuzzleSessionEventType.HINT_DISCOVERED,
      userId,
      { hintId },
    );

    return updated;
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

  /**
   * Make sure an active leader exists. Promotes the earliest active player when
   * the previous leader left. Returns the (possibly unchanged) leader.
   */
  private async ensureLeader(sessionId: string) {
    const activePlayers = await this.playerService.getActivePlayers(sessionId);
    if (activePlayers.length === 0) return null;

    const leader = activePlayers.find(
      (player) => player.role === PuzzlePlayerRole.LEADER,
    );
    if (leader) return leader;

    return this.playerService.assignRole(
      sessionId,
      activePlayers[0].userId,
      PuzzlePlayerRole.LEADER,
    );
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
