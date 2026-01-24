import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Replay, PrivacyLevel } from '../entities/replay.entity';
import { Action, ActionType } from '../entities/action.entity';
import { Recording, RecordingStatus, CompressionType } from '../entities/recording.entity';
import { CompressionService } from '../compression/compression.service';
import { StorageService } from '../storage/storage.service';
import { v4 as uuidv4 } from 'uuid';

export interface RecordActionInput {
  replayId: string;
  type: ActionType;
  payload: Record<string, any>;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CreateReplayInput {
  puzzleId: number;
  playerId: number;
  title: string;
  description?: string;
  privacyLevel?: PrivacyLevel;
  initialState: any;
}

export interface PlaybackOptions {
  speed?: number;
  startPosition?: number;
  endPosition?: number;
}

@Injectable()
export class ReplayService {
  constructor(
    @InjectRepository(Replay)
    private replayRepository: Repository<Replay>,
    @InjectRepository(Action)
    private actionRepository: Repository<Action>,
    @InjectRepository(Recording)
    private recordingRepository: Repository<Recording>,
    private compressionService: CompressionService,
    private storageService: StorageService,
  ) {}

  // ==================== Replay Creation ====================

  /**
   * Create a new replay session
   */
  async createReplay(input: CreateReplayInput): Promise<Replay> {
    const replay = this.replayRepository.create({
      id: uuidv4(),
      puzzleId: input.puzzleId,
      playerId: input.playerId,
      title: input.title || `Puzzle ${input.puzzleId} - ${new Date().toISOString()}`,
      description: input.description,
      privacyLevel: input.privacyLevel || PrivacyLevel.PRIVATE,
      initialState: input.initialState,
      shareToken: input.privacyLevel === PrivacyLevel.UNLISTED ? uuidv4() : undefined,
    });

    return this.replayRepository.save(replay);
  }

  /**
   * Get a replay by ID
   */
  async getReplay(replayId: string, viewerId?: number): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId, isDeleted: false },
      relations: ['actions'],
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    // Check privacy permissions
    this.checkViewPermission(replay, viewerId);

    // Update view count
    if (viewerId !== replay.playerId) {
      replay.metadata.viewCount = (replay.metadata.viewCount || 0) + 1;
      await this.replayRepository.save(replay);
    }

    return replay;
  }

  /**
   * Get replays for a specific puzzle
   */
  async getPuzzleReplays(
    puzzleId: number,
    limit: number = 10,
    offset: number = 0,
    viewerId?: number,
  ): Promise<{ data: Replay[]; total: number }> {
    const query = this.replayRepository
      .createQueryBuilder('replay')
      .where('replay.puzzleId = :puzzleId', { puzzleId })
      .andWhere('replay.isDeleted = false')
      .orderBy('replay.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    // Filter by privacy level if viewer is not admin
    if (!viewerId) {
      query.andWhere(
        '(replay.privacyLevel = :public OR replay.privacyLevel = :unlisted)',
        {
          public: PrivacyLevel.PUBLIC,
          unlisted: PrivacyLevel.UNLISTED,
        },
      );
    }

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  /**
   * Get replays created by a specific player
   */
  async getPlayerReplays(
    playerId: number,
    limit: number = 10,
    offset: number = 0,
    viewerId?: number,
  ): Promise<{ data: Replay[]; total: number }> {
    // Only the player or admin can see their replays
    if (viewerId !== playerId) {
      throw new ForbiddenException('Cannot view other players private replays');
    }

    const [data, total] = await this.replayRepository.findAndCount({
      where: { playerId, isDeleted: false },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    return { data, total };
  }

  // ==================== Action Recording ====================

  /**
   * Record an action during gameplay
   */
  async recordAction(input: RecordActionInput): Promise<Action> {
    const replay = await this.replayRepository.findOne({
      where: { id: input.replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${input.replayId} not found`);
    }

    // Get the next sequence number
    const lastAction = await this.actionRepository.findOne({
      where: { replayId: input.replayId },
      order: { sequence: 'DESC' },
    });

    const sequence = (lastAction?.sequence || 0) + 1;
    const relativeTime = input.timestamp - (replay.createdAt?.getTime() || Date.now());

    const action = this.actionRepository.create({
      id: uuidv4(),
      replayId: input.replayId,
      type: input.type,
      payload: input.payload,
      timestamp: input.timestamp,
      relativeTime,
      sequence,
      metadata: input.metadata,
    });

    return this.actionRepository.save(action);
  }

  /**
   * Batch record multiple actions
   */
  async recordActions(inputs: RecordActionInput[]): Promise<Action[]> {
    if (inputs.length === 0) {
      return [];
    }

    const replayId = inputs[0].replayId;
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    const lastAction = await this.actionRepository.findOne({
      where: { replayId },
      order: { sequence: 'DESC' },
    });

    let sequence = (lastAction?.sequence || 0) + 1;
    const replayStartTime = replay.createdAt?.getTime() || Date.now();

    const actions = inputs.map((input) => {
      const action = this.actionRepository.create({
        id: uuidv4(),
        replayId: input.replayId,
        type: input.type,
        payload: input.payload,
        timestamp: input.timestamp,
        relativeTime: input.timestamp - replayStartTime,
        sequence: sequence++,
        metadata: input.metadata,
      });

      return action;
    });

    return this.actionRepository.save(actions);
  }

  /**
   * Get actions for a replay
   */
  async getActions(replayId: string, limit?: number, offset?: number): Promise<Action[]> {
    const query = this.actionRepository
      .createQueryBuilder('action')
      .where('action.replayId = :replayId', { replayId })
      .orderBy('action.sequence', 'ASC');

    if (limit) {
      query.take(limit);
    }
    if (offset) {
      query.skip(offset);
    }

    return query.getMany();
  }

  // ==================== Playback ====================

  /**
   * Generate playback data with optional speed adjustment
   */
  async generatePlayback(
    replayId: string,
    options: PlaybackOptions = {},
  ): Promise<{
    actions: Action[];
    totalDuration: number;
    frameRate: number;
  }> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    const query = this.actionRepository
      .createQueryBuilder('action')
      .where('action.replayId = :replayId', { replayId })
      .orderBy('action.sequence', 'ASC');

    // Apply position filters
    if (options.startPosition !== undefined) {
      query.andWhere('action.relativeTime >= :startTime', {
        startTime: options.startPosition,
      });
    }

    if (options.endPosition !== undefined) {
      query.andWhere('action.relativeTime <= :endTime', {
        endTime: options.endPosition,
      });
    }

    const actions = await query.getMany();

    // Adjust timing based on speed
    const speed = options.speed || 1;
    const adjustedActions = actions.map((action) => ({
      ...action,
      relativeTime: Math.round(action.relativeTime / speed),
    }));

    // Calculate total duration
    const lastAction = adjustedActions[adjustedActions.length - 1];
    const totalDuration = lastAction ? lastAction.relativeTime : 0;

    return {
      actions: adjustedActions,
      totalDuration,
      frameRate: 30, // Default 30 FPS
    };
  }

  // ==================== Recording Management ====================

  /**
   * Save a replay recording with compression
   */
  async saveRecording(
    replayId: string,
    metadata: any = {},
  ): Promise<Recording> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
      relations: ['actions'],
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    // Serialize replay data
    const replayData = JSON.stringify({
      id: replay.id,
      puzzleId: replay.puzzleId,
      playerId: replay.playerId,
      initialState: replay.initialState,
      actions: replay.actions,
      metadata: replay.metadata,
    });

    const dataBuffer = Buffer.from(replayData);
    const originalSize = dataBuffer.length;

    // Determine compression type
    const compressionType = this.compressionService.getRecommendedCompressionType(originalSize);

    // Compress data
    const { compressed } = await this.compressionService.compress(dataBuffer, compressionType);
    const compressedSize = compressed.length;

    // Store compressed data
    const { key, url } = await this.storageService.storeReplay(
      replayId,
      compressed,
      metadata,
    );

    // Create recording record
    const recording = this.recordingRepository.create({
      id: uuidv4(),
      replayId,
      playerId: replay.playerId,
      puzzleId: replay.puzzleId,
      status: RecordingStatus.COMPLETED,
      compressionType,
      originalSize,
      compressedSize,
      compressionRatio: this.compressionService.calculateCompressionRatio(
        originalSize,
        compressedSize,
      ),
      storageKey: key,
      storageUrl: url,
      actionCount: replay.actions?.length || 0,
      metadata,
    });

    return this.recordingRepository.save(recording);
  }

  /**
   * Get a recording
   */
  async getRecording(recordingId: string): Promise<Recording> {
    const recording = await this.recordingRepository.findOne({
      where: { id: recordingId },
    });

    if (!recording) {
      throw new NotFoundException(`Recording ${recordingId} not found`);
    }

    return recording;
  }

  /**
   * Retrieve a complete replay from storage
   */
  async retrieveRecording(recordingId: string): Promise<any> {
    const recording = await this.getRecording(recordingId);

    if (!recording.storageKey) {
      throw new BadRequestException('Recording has no stored data');
    }

    // Retrieve compressed data
    const compressedData = await this.storageService.retrieveReplay(recording.storageKey);

    // Decompress data
    const decompressed = await this.compressionService.decompress(
      compressedData,
      recording.compressionType,
    );

    // Parse and return
    return JSON.parse(decompressed.toString());
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = await this.getRecording(recordingId);

    if (recording.storageKey) {
      await this.storageService.deleteReplay(recording.storageKey);
    }

    await this.recordingRepository.remove(recording);
  }

  // ==================== Privacy and Sharing ====================

  /**
   * Update replay privacy level
   */
  async updatePrivacy(
    replayId: string,
    playerId: number,
    privacyLevel: PrivacyLevel,
  ): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    if (replay.playerId !== playerId) {
      throw new ForbiddenException('Cannot modify other players replays');
    }

    replay.privacyLevel = privacyLevel;

    // Generate share token if needed
    if (privacyLevel === PrivacyLevel.UNLISTED && !replay.shareToken) {
      replay.shareToken = uuidv4();
    }

    return this.replayRepository.save(replay);
  }

  /**
   * Share a replay with specific users
   */
  async shareReplay(
    replayId: string,
    playerId: number,
    userIds: number[],
  ): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    if (replay.playerId !== playerId) {
      throw new ForbiddenException('Cannot share other players replays');
    }

    // Add new users to sharedWith
    replay.sharedWith = [...new Set([...replay.sharedWith, ...userIds])];
    replay.privacyLevel = PrivacyLevel.SHARED;

    return this.replayRepository.save(replay);
  }

  /**
   * Revoke access from a user
   */
  async revokeAccess(
    replayId: string,
    playerId: number,
    userId: number,
  ): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    if (replay.playerId !== playerId) {
      throw new ForbiddenException('Cannot revoke access from other players replays');
    }

    replay.sharedWith = replay.sharedWith.filter((id) => id !== userId);

    return this.replayRepository.save(replay);
  }

  /**
   * Get a replay by share token
   */
  async getReplayByToken(token: string): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: {
        shareToken: token,
        isDeleted: false,
        privacyLevel: PrivacyLevel.UNLISTED,
      },
    });

    if (!replay) {
      throw new NotFoundException('Replay not found');
    }

    return replay;
  }

  /**
   * Check if a user has permission to view a replay
   */
  private checkViewPermission(replay: Replay, viewerId?: number): void {
    if (replay.privacyLevel === PrivacyLevel.PUBLIC) {
      return; // Anyone can view
    }

    if (replay.playerId === viewerId) {
      return; // Owner can view
    }

    if (replay.privacyLevel === PrivacyLevel.SHARED && viewerId && replay.sharedWith.includes(viewerId)) {
      return; // Shared users can view
    }

    throw new ForbiddenException('Cannot access this replay');
  }

  /**
   * Soft delete a replay
   */
  async deleteReplay(replayId: string, playerId: number): Promise<void> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay ${replayId} not found`);
    }

    if (replay.playerId !== playerId) {
      throw new ForbiddenException('Cannot delete other players replays');
    }

    replay.isDeleted = true;
    await this.replayRepository.save(replay);
  }
}
