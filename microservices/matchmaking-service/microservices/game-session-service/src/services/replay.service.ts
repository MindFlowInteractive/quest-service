import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Replay, ReplayMove, ReplaySnapshot } from '../entities/replay.entity';
import { SessionService } from './session.service';
import { v4 as uuidv4 } from 'uuid';

export interface RecordMoveDto {
  sessionId: string;
  moveType: string;
  moveData: any;
  moveNumber: number;
}

export interface PlaybackOptions {
  speed?: number; // playback speed multiplier (1.0 = normal, 2.0 = 2x speed)
  startFrom?: number; // start from specific move number
  endAt?: number; // end at specific move number
}

@Injectable()
export class ReplayService {
  private readonly logger = new Logger(ReplayService.name);

  constructor(
    @InjectRepository(Replay)
    private readonly replayRepository: Repository<Replay>,
    private readonly sessionService: SessionService,
  ) {}

  async startRecording(sessionId: string, initialState: Record<string, any>): Promise<Replay> {
    // Check if replay already exists
    const existing = await this.replayRepository.findOne({
      where: { sessionId },
    });

    if (existing && existing.isRecording) {
      throw new BadRequestException(`Recording already in progress for session: ${sessionId}`);
    }

    const session = await this.sessionService.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    let replay: Replay;

    if (existing) {
      // Resume recording
      replay = existing;
      replay.isRecording = true;
      replay.recordingStartedAt = new Date();
      replay.recordingEndedAt = undefined;
    } else {
      // Create new replay
      replay = this.replayRepository.create({
        sessionId,
        userId: session.userId,
        puzzleId: session.puzzleId,
        initialState,
        moves: [],
        snapshots: [],
        totalDuration: 0,
        totalMoves: 0,
        metadata: {},
        isRecording: true,
        recordingStartedAt: new Date(),
      });
    }

    const saved = await this.replayRepository.save(replay);
    this.logger.log(`Recording started for session: ${sessionId}`);
    return saved;
  }

  async stopRecording(sessionId: string): Promise<Replay> {
    const replay = await this.getReplayBySessionId(sessionId);

    if (!replay.isRecording) {
      throw new BadRequestException(`No active recording for session: ${sessionId}`);
    }

    replay.isRecording = false;
    replay.recordingEndedAt = new Date();

    if (replay.recordingStartedAt) {
      replay.totalDuration = Math.floor(
        (replay.recordingEndedAt.getTime() - replay.recordingStartedAt.getTime()),
      );
    }

    const saved = await this.replayRepository.save(replay);
    this.logger.log(`Recording stopped for session: ${sessionId}`);
    return saved;
  }

  async recordMove(dto: RecordMoveDto): Promise<Replay> {
    const replay = await this.getReplayBySessionId(dto.sessionId);

    if (!replay.isRecording) {
      throw new BadRequestException(`Recording not active for session: ${dto.sessionId}`);
    }

    const now = new Date();
    const startTime = replay.recordingStartedAt || now;
    const relativeTime = Math.floor((now.getTime() - startTime.getTime()));

    const move: ReplayMove = {
      moveId: uuidv4(),
      moveType: dto.moveType,
      moveData: dto.moveData,
      timestamp: now,
      relativeTime,
      moveNumber: dto.moveNumber,
    };

    replay.moves.push(move);
    replay.totalMoves = replay.moves.length;

    const saved = await this.replayRepository.save(replay);
    this.logger.debug(`Move recorded for session ${dto.sessionId}, move ${dto.moveNumber}`);
    return saved;
  }

  async recordSnapshot(
    sessionId: string,
    snapshotId: string,
    step: number,
    state: any,
  ): Promise<Replay> {
    const replay = await this.getReplayBySessionId(sessionId);

    if (!replay.isRecording) {
      throw new BadRequestException(`Recording not active for session: ${sessionId}`);
    }

    const now = new Date();
    const startTime = replay.recordingStartedAt || now;
    const relativeTime = Math.floor((now.getTime() - startTime.getTime()));

    const snapshot: ReplaySnapshot = {
      snapshotId,
      step,
      state,
      timestamp: now,
      relativeTime,
    };

    replay.snapshots.push(snapshot);

    const saved = await this.replayRepository.save(replay);
    return saved;
  }

  async getReplayBySessionId(sessionId: string): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { sessionId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay not found for session: ${sessionId}`);
    }

    return replay;
  }

  async getReplayById(replayId: string): Promise<Replay> {
    const replay = await this.replayRepository.findOne({
      where: { id: replayId },
    });

    if (!replay) {
      throw new NotFoundException(`Replay not found: ${replayId}`);
    }

    return replay;
  }

  async getReplaysByUserId(userId: string, limit = 20): Promise<Replay[]> {
    return this.replayRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async playReplay(
    replayId: string,
    options: PlaybackOptions = {},
  ): Promise<{
    replay: Replay;
    playbackSequence: Array<{
      type: 'move' | 'snapshot';
      data: ReplayMove | ReplaySnapshot;
      relativeTime: number;
    }>;
  }> {
    const replay = await this.getReplayById(replayId);

    if (replay.isRecording) {
      throw new BadRequestException('Cannot play replay while recording is active');
    }

    if (replay.moves.length === 0) {
      throw new BadRequestException('Replay has no moves to play');
    }

    const speed = options.speed || 1.0;
    const startFrom = options.startFrom || 0;
    const endAt = options.endAt || replay.moves.length - 1;

    // Combine moves and snapshots into a single timeline
    const playbackSequence: Array<{
      type: 'move' | 'snapshot';
      data: ReplayMove | ReplaySnapshot;
      relativeTime: number;
    }> = [];

    // Add moves
    for (const move of replay.moves) {
      if (move.moveNumber >= startFrom && move.moveNumber <= endAt) {
        playbackSequence.push({
          type: 'move',
          data: move,
          relativeTime: Math.floor(move.relativeTime / speed),
        });
      }
    }

    // Add snapshots
    for (const snapshot of replay.snapshots) {
      if (snapshot.step >= startFrom && snapshot.step <= endAt) {
        playbackSequence.push({
          type: 'snapshot',
          data: snapshot,
          relativeTime: Math.floor(snapshot.relativeTime / speed),
        });
      }
    }

    // Sort by relative time
    playbackSequence.sort((a, b) => a.relativeTime - b.relativeTime);

    return {
      replay,
      playbackSequence,
    };
  }

  async updateMetadata(
    replayId: string,
    metadata: Partial<Replay['metadata']>,
  ): Promise<Replay> {
    const replay = await this.getReplayById(replayId);
    replay.metadata = { ...replay.metadata, ...metadata };
    return this.replayRepository.save(replay);
  }

  async deleteReplay(replayId: string): Promise<void> {
    const replay = await this.getReplayById(replayId);
    await this.replayRepository.remove(replay);
    this.logger.log(`Replay deleted: ${replayId}`);
  }
}
