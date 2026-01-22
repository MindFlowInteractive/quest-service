import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Replay } from './entities/replay.entity';

@Injectable()
export class ReplayService {
  private readonly logger = new Logger(ReplayService.name);
  private readonly snapshotInterval = 10; // Snapshot every 10 moves

  constructor(
    @InjectRepository(Replay)
    private readonly replayRepository: Repository<Replay>,
  ) {}

  async handlePuzzleStarted(data: { puzzleId: string; playerId: string; initialState: any }) {
    this.logger.log(`Recording started for puzzle ${data.puzzleId} by player ${data.playerId}`);
    
    // Check if there's an existing in-progress replay and archive it if necessary
    // For now, we just create a new one
    const replay = this.replayRepository.create({
      puzzleId: data.puzzleId,
      playerId: data.playerId,
      initialState: data.initialState,
      moves: [],
      snapshots: [{ step: 0, state: data.initialState, timestamp: new Date() }],
      metadata: { defaultSpeed: 1, completed: false },
    });

    return this.replayRepository.save(replay);
  }

  async handlePuzzleMove(data: { 
    puzzleId: string; 
    playerId: string; 
    move: any; 
    currentState: any;
    timestamp?: Date;
  }) {
    const replay = await this.replayRepository.findOne({
      where: { puzzleId: data.puzzleId, playerId: data.playerId },
      order: { createdAt: 'DESC' },
    });

    if (!replay) {
      this.logger.warn(`No active replay found for puzzle ${data.puzzleId} and player ${data.playerId}`);
      return;
    }

    const moveTimestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const relativeTime = moveTimestamp.getTime() - replay.createdAt.getTime();

    replay.moves.push({
      moveData: data.move,
      timestamp: moveTimestamp,
      relativeTime,
    });

    // Handle snapshot every 10 moves
    if (replay.moves.length % this.snapshotInterval === 0) {
      replay.snapshots.push({
        step: replay.moves.length,
        state: data.currentState,
        timestamp: moveTimestamp,
      });
    }

    // Update duration in metadata
    replay.metadata.totalDuration = relativeTime;

    return this.replayRepository.save(replay);
  }

  async getLatestReplay(puzzleId: string, playerId: string) {
    return this.replayRepository.findOne({
      where: { puzzleId, playerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getReplayById(id: string) {
    return this.replayRepository.findOneBy({ id });
  }

  /**
   * Comparison tool helper: Returns state at a specific move index
   * It uses the closest snapshot to reconstruct the state if needed.
   * (Placeholder logic: in a real cause-effect engine, it might re-apply moves)
   */
  async getReplayCompareState(replayId: string, moveIndex: number) {
    const replay = await this.replayRepository.findOneBy({ id: replayId });
    if (!replay) return null;

    // Find the closest snapshot <= moveIndex
    const snapshot = [...replay.snapshots]
      .reverse()
      .find(s => s.step <= moveIndex);
    
    return {
      snapshot,
      targetMoveIndex: moveIndex,
      totalMoves: replay.moves.length,
      // In a real implementation, you'd iterate from snapshot.state + moves[snapshot.step...moveIndex]
    };
  }
}
