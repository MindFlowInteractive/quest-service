import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { PuzzleReplay, ReplaySharePermission } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import { ReplayAnalytic } from '../entities/replay-analytic.entity';
import {
  CreateReplayDto,
  RecordActionDto,
  CompleteReplayDto,
  ShareReplayDto,
} from '../dto/create-replay.dto';
import { ReplayPlaybackDto, PlaybackMetadataDto, PlaybackActionDto } from '../dto/replay-playback.dto';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';

const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

/**
 * Service for managing puzzle replays
 * Handles recording, storage, retrieval, and sharing of puzzle solving sessions
 */
@Injectable()
export class ReplayService {
  constructor(
    @InjectRepository(PuzzleReplay)
    private readonly replayRepo: Repository<PuzzleReplay>,
    @InjectRepository(ReplayAction)
    private readonly actionRepo: Repository<ReplayAction>,
    @InjectRepository(ReplayAnalytic)
    private readonly analyticRepo: Repository<ReplayAnalytic>,
  ) {}

  /**
   * Create a new replay session
   */
  async createReplay(
    userId: string,
    createDto: CreateReplayDto,
  ): Promise<PuzzleReplay> {
    const replay = this.replayRepo.create({
      userId,
      puzzleId: createDto.puzzleId,
      puzzleTitle: createDto.puzzleTitle,
      puzzleCategory: createDto.puzzleCategory,
      puzzleDifficulty: createDto.puzzleDifficulty,
      gameSessionId: createDto.gameSessionId || null,
      initialState: createDto.initialState || {},
      userMetadata: createDto.userMetadata || {},
      sessionMetadata: createDto.sessionMetadata || {},
      permission: ReplaySharePermission.PRIVATE,
    });

    return this.replayRepo.save(replay);
  }

  /**
   * Record an action during gameplay
   */
  async recordAction(
    replayId: string,
    actionDto: RecordActionDto,
  ): Promise<ReplayAction> {
    const replay = await this.replayRepo.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay with id ${replayId} not found`);
    }

    if (replay.isCompleted) {
      throw new BadRequestException('Cannot record actions on a completed replay');
    }

    // Get the next sequence number
    const lastAction = await this.actionRepo.findOne({
      where: { replayId },
      order: { sequenceNumber: 'DESC' },
    });

    const sequenceNumber = lastAction ? lastAction.sequenceNumber + 1 : 0;

    const action = this.actionRepo.create({
      replayId,
      sequenceNumber,
      actionType: actionDto.actionType,
      timestamp: actionDto.timestamp,
      actionData: actionDto.actionData || {},
      stateBefore: actionDto.stateBefore,
      stateAfter: actionDto.stateAfter,
      metadata: actionDto.metadata || {},
    });

    // Update replay metrics based on action type
    await this.updateReplayMetrics(replayId, actionDto);

    return this.actionRepo.save(action);
  }

  /**
   * Update replay metrics based on recorded action
   */
  private async updateReplayMetrics(replayId: string, actionDto: RecordActionDto) {
    const replay = await this.replayRepo.findOne({ where: { id: replayId } });
    if (!replay) return;

    // Update move count
    replay.movesCount += 1;

    // Update specific metrics based on action type
    switch (actionDto.actionType) {
      case 'HINT_USED':
        replay.hintsUsed += 1;
        break;
      case 'UNDO':
        replay.undosCount += 1;
        break;
      case 'STATE_CHANGE':
        replay.stateChanges += 1;
        break;
      case 'PAUSE':
        // Track pause time
        if (actionDto.metadata?.duration) {
          replay.pausedTime += actionDto.metadata.duration;
        }
        break;
    }

    // Update last active timestamp
    replay.lastViewedAt = new Date();

    await this.replayRepo.save(replay);
  }

  /**
   * Complete a replay session
   */
  async completeReplay(
    replayId: string,
    completeDto: CompleteReplayDto,
  ): Promise<PuzzleReplay> {
    const replay = await this.replayRepo.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay with id ${replayId} not found`);
    }

    replay.isCompleted = true;
    replay.completedAt = new Date();
    replay.isSolved = completeDto.isSolved;
    replay.totalDuration = completeDto.totalDuration || replay.totalDuration;
    replay.activeTime = completeDto.activeTime || replay.totalDuration;
    replay.scoreEarned = completeDto.scoreEarned || null;
    replay.maxScorePossible = completeDto.maxScorePossible || null;
    replay.finalState = completeDto.finalState;

    // Calculate efficiency
    if (replay.scoreEarned && replay.maxScorePossible) {
      replay.efficiency = (replay.scoreEarned / replay.maxScorePossible) * 100;
    }

    return this.replayRepo.save(replay);
  }

  /**
   * Get a replay by ID with basic info
   */
  async getReplay(replayId: string): Promise<PuzzleReplay> {
    const replay = await this.replayRepo.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay with id ${replayId} not found`);
    }

    return replay;
  }

  /**
   * Get playback data for a replay (all actions in order)
   */
  async getPlaybackData(replayId: string): Promise<ReplayPlaybackDto> {
    const replay = await this.getReplay(replayId);

    const actions = await this.actionRepo.find({
      where: { replayId },
      order: { sequenceNumber: 'ASC' },
    });

    const metadata: PlaybackMetadataDto = {
      replayId: replay.id,
      puzzleTitle: replay.puzzleTitle,
      puzzleCategory: replay.puzzleCategory,
      puzzleDifficulty: replay.puzzleDifficulty,
      playerUserId: replay.userId,
      isSolved: replay.isSolved,
      totalDuration: replay.totalDuration,
      activeTime: replay.activeTime,
      movesCount: replay.movesCount,
      hintsUsed: replay.hintsUsed,
      scoreEarned: replay.scoreEarned,
      efficiency: replay.efficiency,
      completedAt: replay.completedAt,
      initialState: replay.initialState,
      finalState: replay.finalState,
    };

    const playbackActions: PlaybackActionDto[] = actions.map((action) => ({
      id: action.id,
      sequenceNumber: action.sequenceNumber,
      actionType: action.actionType,
      timestamp: action.timestamp,
      actionData: action.actionData,
      stateBefore: action.stateBefore,
      stateAfter: action.stateAfter,
      metadata: action.metadata,
    }));

    return {
      metadata,
      actions: playbackActions,
      totalActions: actions.length,
    };
  }

  /**
   * Get user's replays with pagination
   */
  async getUserReplays(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      puzzleId?: string;
      isCompleted?: boolean;
      isSolved?: boolean;
      minDifficulty?: string;
    },
  ): Promise<{ replays: PuzzleReplay[]; total: number }> {
    let query = this.replayRepo
      .createQueryBuilder('replay')
      .where('replay.userId = :userId', { userId });

    if (filters?.puzzleId) {
      query = query.andWhere('replay.puzzleId = :puzzleId', {
        puzzleId: filters.puzzleId,
      });
    }

    if (filters?.isCompleted !== undefined) {
      query = query.andWhere('replay.isCompleted = :isCompleted', {
        isCompleted: filters.isCompleted,
      });
    }

    if (filters?.isSolved !== undefined) {
      query = query.andWhere('replay.isSolved = :isSolved', {
        isSolved: filters.isSolved,
      });
    }

    const total = await query.getCount();

    const replays = await query
      .orderBy('replay.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { replays, total };
  }

  /**
   * Share a replay with a shareable link
   */
  async shareReplay(
    replayId: string,
    userId: string,
    shareDto: ShareReplayDto,
  ): Promise<PuzzleReplay> {
    const replay = await this.getReplay(replayId);

    // Verify ownership
    if (replay.userId !== userId) {
      throw new BadRequestException('You can only share your own replays');
    }

    replay.permission = shareDto.permission as ReplaySharePermission;

    // Generate share code if sharing via link
    if (shareDto.permission === ReplaySharePermission.SHARED_LINK) {
      replay.shareCode = this.generateShareCode();
    } else {
      replay.shareCode = null;
    }

    if (shareDto.shareExpiredAt) {
      replay.shareExpiredAt = shareDto.shareExpiredAt;
    }

    return this.replayRepo.save(replay);
  }

  /**
   * Get a replay by share code (public access)
   */
  async getSharedReplay(shareCode: string): Promise<PuzzleReplay> {
    const replay = await this.replayRepo.findOne({
      where: { shareCode },
    });

    if (!replay) {
      throw new NotFoundException('Shared replay not found');
    }

    // Check if share has expired
    if (replay.shareExpiredAt && new Date() > replay.shareExpiredAt) {
      throw new BadRequestException('This replay share has expired');
    }

    // Check if permission allows sharing
    if (
      replay.permission !== ReplaySharePermission.SHARED_LINK &&
      replay.permission !== ReplaySharePermission.PUBLIC
    ) {
      throw new BadRequestException('This replay is not shared');
    }

    // Increment view count
    replay.viewCount += 1;
    replay.lastViewedAt = new Date();
    await this.replayRepo.save(replay);

    return replay;
  }

  /**
   * Get public replays for a puzzle (for learning)
   */
  async getPublicReplays(
    puzzleId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ replays: PuzzleReplay[]; total: number }> {
    let query = this.replayRepo
      .createQueryBuilder('replay')
      .where('replay.puzzleId = :puzzleId', { puzzleId })
      .andWhere('replay.permission = :permission', {
        permission: ReplaySharePermission.PUBLIC,
      })
      .andWhere('replay.isCompleted = :isCompleted', { isCompleted: true });

    // Exclude expired shares
    query = query.andWhere(
      '(replay.shareExpiredAt IS NULL OR replay.shareExpiredAt > NOW())',
    );

    const total = await query.getCount();

    const replays = await query
      .orderBy('replay.viewCount', 'DESC') // Sort by most viewed
      .addOrderBy('replay.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { replays, total };
  }

  /**
   * Delete a replay (soft delete via archiveStatus)
   */
  async deleteReplay(replayId: string, userId: string): Promise<void> {
    const replay = await this.getReplay(replayId);

    // Verify ownership
    if (replay.userId !== userId) {
      throw new BadRequestException('You can only delete your own replays');
    }

    replay.archiveStatus = 'deleted';
    await this.replayRepo.save(replay);
  }

  /**
   * Archive old replays for storage optimization
   */
  async archiveOldReplays(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.replayRepo
      .createQueryBuilder()
      .update(PuzzleReplay)
      .set({ archiveStatus: 'archived' })
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('archiveStatus = :status', { status: 'active' })
      .execute();

    return result.affected || 0;
  }

  /**
   * Generate a unique share code
   */
  private generateShareCode(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Record an analytic event for a replay
   */
  async recordAnalytic(
    replayId: string,
    metricType:
      | 'VIEW'
      | 'LEARNING_EFFECTIVENESS'
      | 'STRATEGY_PATTERN'
      | 'DIFFICULTY_RATING'
      | 'COMPARISON_METRIC',
    metricValue: Record<string, any>,
  ): Promise<ReplayAnalytic> {
    const analytic = this.analyticRepo.create({
      replayId,
      metricType,
      metricValue,
      recordedAt: new Date(),
    });

    return this.analyticRepo.save(analytic);
  }

  /**
   * Get analytics for a replay
   */
  async getReplayAnalytics(
    replayId: string,
    metricType?: string,
  ): Promise<ReplayAnalytic[]> {
    const query = this.analyticRepo.createQueryBuilder().where('replayId = :replayId', {
      replayId,
    });

    if (metricType) {
      query.andWhere('metricType = :metricType', { metricType });
    }

    return query.orderBy('recordedAt', 'DESC').getMany();
  }
}
