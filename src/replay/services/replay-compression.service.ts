import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleReplay } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import * as zlib from 'zlib';
import { promisify } from 'util';

const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

/**
 * Service for compressing and decompressing replay data
 * Reduces storage space using delta compression and gzip
 */
@Injectable()
export class ReplayCompressionService {
  constructor(
    @InjectRepository(PuzzleReplay)
    private readonly replayRepo: Repository<PuzzleReplay>,
    @InjectRepository(ReplayAction)
    private readonly actionRepo: Repository<ReplayAction>,
  ) {}

  /**
   * Compress a replay by storing deltas instead of full states
   */
  async compressReplay(replayId: string): Promise<void> {
    const replay = await this.replayRepo.findOne({ where: { id: replayId } });
    if (!replay || replay.isCompressed) {
      return;
    }

    const actions = await this.actionRepo.find({
      where: { replayId },
      order: { sequenceNumber: 'ASC' },
    });

    if (actions.length === 0) {
      return;
    }

    // Apply delta compression: store state differences instead of full states
    let previousState = replay.initialState || {};

    for (const action of actions) {
      if (action.stateAfter) {
        // Store only the delta (differences) from previous state
        const delta = this.calculateDelta(previousState, action.stateAfter);
        action.stateAfter = delta;
        previousState = action.stateAfter;
      }
      await this.actionRepo.save(action);
    }

    // Mark as compressed
    replay.isCompressed = true;
    await this.replayRepo.save(replay);
  }

  /**
   * Decompress a replay by reconstructing full states from deltas
   */
  async decompressReplay(replayId: string): Promise<ReplayAction[]> {
    const replay = await this.replayRepo.findOne({ where: { id: replayId } });
    if (!replay) {
      return [];
    }

    const actions = await this.actionRepo.find({
      where: { replayId },
      order: { sequenceNumber: 'ASC' },
    });

    if (!replay.isCompressed) {
      return actions;
    }

    // Reconstruct full states from deltas
    let currentState = replay.initialState || {};
    const reconstructedActions: ReplayAction[] = [];

    for (const action of actions) {
      if (action.stateAfter) {
        // Merge delta with current state
        currentState = this.applyDelta(currentState, action.stateAfter);
        action.stateAfter = currentState;
      }
      reconstructedActions.push(action);
    }

    return reconstructedActions;
  }

  /**
   * Archive replay by compressing and gzipping data
   * Converts JSON data to compressed binary for long-term storage
   */
  async archiveReplay(replayId: string): Promise<number> {
    const replay = await this.replayRepo.findOne({ where: { id: replayId } });
    if (!replay) {
      return 0;
    }

    // First compress with delta encoding
    await this.compressReplay(replayId);

    // Get all actions
    const actions = await this.actionRepo.find({
      where: { replayId },
      order: { sequenceNumber: 'ASC' },
    });

    // Create archive data structure
    const archiveData = {
      replayId,
      userId: replay.userId,
      puzzleId: replay.puzzleId,
      isSolved: replay.isSolved,
      totalDuration: replay.totalDuration,
      movesCount: replay.movesCount,
      scoreEarned: replay.scoreEarned,
      initialState: replay.initialState,
      actions: actions.map((a) => ({
        seq: a.sequenceNumber,
        type: a.actionType,
        ts: a.timestamp,
        data: a.actionData,
        meta: a.metadata,
        state: a.stateAfter, // Already compressed with deltas
      })),
    };

    // Serialize and compress
    const jsonData = JSON.stringify(archiveData);
    const compressedData = await compress(Buffer.from(jsonData));

    // Update storage size
    replay.storageSize = compressedData.length;
    await this.replayRepo.save(replay);

    return compressedData.length;
  }

  /**
   * Calculate delta (differences) between two objects
   */
  private calculateDelta(
    previousState: Record<string, any>,
    currentState: Record<string, any>,
  ): Record<string, any> {
    const delta: Record<string, any> = {};

    // Find changed keys
    for (const key in currentState) {
      if (
        !(key in previousState) ||
        JSON.stringify(previousState[key]) !== JSON.stringify(currentState[key])
      ) {
        delta[key] = currentState[key];
      }
    }

    // Mark removed keys
    for (const key in previousState) {
      if (!(key in currentState)) {
        delta[key] = undefined;
      }
    }

    return delta;
  }

  /**
   * Apply delta to a state to get updated state
   */
  private applyDelta(
    previousState: Record<string, any>,
    delta: Record<string, any>,
  ): Record<string, any> {
    const newState = { ...previousState };

    for (const key in delta) {
      if (delta[key] === undefined) {
        delete newState[key];
      } else {
        newState[key] = delta[key];
      }
    }

    return newState;
  }

  /**
   * Get estimated compression ratio
   */
  async getCompressionStats(replayId: string): Promise<{
    original: number;
    compressed: number;
    ratio: number;
    savings: number;
  }> {
    const actions = await this.actionRepo.find({ where: { replayId } });

    const originalSize = JSON.stringify(actions).length;
    const compressed = await compress(Buffer.from(JSON.stringify(actions)));

    const compressedSize = compressed.length;
    const ratio = (compressedSize / originalSize) * 100;
    const savings = ((originalSize - compressedSize) / originalSize) * 100;

    return {
      original: originalSize,
      compressed: compressedSize,
      ratio: Math.round(ratio * 100) / 100,
      savings: Math.round(savings * 100) / 100,
    };
  }
}
