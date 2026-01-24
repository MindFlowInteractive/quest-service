import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { StateSnapshot, SnapshotType } from '../entities/state.entity';
import { SessionService } from './session.service';
import { RedisCacheService } from './redis-cache.service';

export interface CreateSnapshotDto {
  sessionId: string;
  state: Record<string, any>;
  snapshotType?: SnapshotType;
  checkpointName?: string;
  isRestorePoint?: boolean;
}

@Injectable()
export class StateSnapshotService {
  private readonly logger = new Logger(StateSnapshotService.name);
  private readonly MAX_SNAPSHOTS_PER_SESSION = 100;
  private readonly SNAPSHOT_INTERVAL_MS = 30000; // 30 seconds

  constructor(
    @InjectRepository(StateSnapshot)
    private readonly snapshotRepository: Repository<StateSnapshot>,
    private readonly sessionService: SessionService,
    private readonly redisCache: RedisCacheService,
  ) {}

  async createSnapshot(dto: CreateSnapshotDto): Promise<StateSnapshot> {
    // Verify session exists
    const session = await this.sessionService.findById(dto.sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${dto.sessionId}`);
    }

    // Get the last snapshot to calculate move number and delta
    const lastSnapshot = await this.getLastSnapshot(dto.sessionId);
    const moveNumber = lastSnapshot ? lastSnapshot.moveNumber + 1 : 0;

    const snapshotType = dto.snapshotType || SnapshotType.INCREMENTAL;
    let previousState: Record<string, any> | undefined;
    let changes: Record<string, any> | undefined;

    if (snapshotType === SnapshotType.INCREMENTAL && lastSnapshot) {
      previousState = lastSnapshot.state;
      changes = this.calculateDelta(previousState, dto.state);
    }

    const snapshot = this.snapshotRepository.create({
      sessionId: dto.sessionId,
      snapshotType,
      moveNumber,
      state: dto.state,
      previousState,
      changes,
      checkpointName: dto.checkpointName,
      isRestorePoint: dto.isRestorePoint || false,
      sizeBytes: this.calculateSize(dto.state),
    });

    const saved = await this.snapshotRepository.save(snapshot);

    // Cache latest snapshot
    await this.redisCache.setLatestSnapshot(dto.sessionId, saved);

    // Cleanup old snapshots if needed
    await this.cleanupOldSnapshots(dto.sessionId);

    this.logger.debug(
      `Snapshot created for session ${dto.sessionId}, move ${moveNumber}`,
    );
    return saved;
  }

  async getLastSnapshot(sessionId: string): Promise<StateSnapshot | null> {
    // Try cache first
    const cached = await this.redisCache.getLatestSnapshot(sessionId);
    if (cached) {
      return cached;
    }

    // Fallback to database
    const snapshot = await this.snapshotRepository.findOne({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });

    if (snapshot) {
      await this.redisCache.setLatestSnapshot(sessionId, snapshot);
    }

    return snapshot;
  }

  async getSnapshotById(snapshotId: string): Promise<StateSnapshot> {
    const snapshot = await this.snapshotRepository.findOne({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException(`Snapshot not found: ${snapshotId}`);
    }

    return snapshot;
  }

  async getSnapshotsBySession(
    sessionId: string,
    limit = 50,
  ): Promise<StateSnapshot[]> {
    return this.snapshotRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRestorePoints(sessionId: string): Promise<StateSnapshot[]> {
    return this.snapshotRepository.find({
      where: { sessionId, isRestorePoint: true },
      order: { createdAt: 'DESC' },
    });
  }

  async restoreToSnapshot(snapshotId: string): Promise<StateSnapshot> {
    const snapshot = await this.getSnapshotById(snapshotId);

    // If it's an incremental snapshot, we need to reconstruct the full state
    if (snapshot.snapshotType === SnapshotType.INCREMENTAL) {
      const fullState = await this.reconstructFullState(
        snapshot.sessionId,
        snapshot,
      );
      snapshot.state = fullState;
    }

    return snapshot;
  }

  async createCheckpoint(
    sessionId: string,
    checkpointName: string,
    state: Record<string, any>,
  ): Promise<StateSnapshot> {
    return this.createSnapshot({
      sessionId,
      state,
      snapshotType: SnapshotType.CHECKPOINT,
      checkpointName,
      isRestorePoint: true,
    });
  }

  private async reconstructFullState(
    sessionId: string,
    targetSnapshot: StateSnapshot,
  ): Promise<Record<string, any>> {
    // Find the last full snapshot before this one
    const fullSnapshot = await this.snapshotRepository.findOne({
      where: {
        sessionId,
        snapshotType: SnapshotType.FULL,
        createdAt: LessThan(targetSnapshot.createdAt),
      },
      order: { createdAt: 'DESC' },
    });

    let state = fullSnapshot ? { ...fullSnapshot.state } : {};

    // Apply all incremental changes up to target
    const queryBuilder = this.snapshotRepository.createQueryBuilder('snapshot')
      .where('snapshot.sessionId = :sessionId', { sessionId })
      .andWhere('snapshot.snapshotType = :type', { type: SnapshotType.INCREMENTAL })
      .andWhere('snapshot.createdAt <= :targetDate', { targetDate: targetSnapshot.createdAt });

    if (fullSnapshot) {
      queryBuilder.andWhere('snapshot.createdAt > :fullDate', { fullDate: fullSnapshot.createdAt });
    }

    const incrementalSnapshots = await queryBuilder
      .orderBy('snapshot.createdAt', 'ASC')
      .getMany();

    for (const inc of incrementalSnapshots) {
      if (inc.changes) {
        state = this.applyDelta(state, inc.changes);
      }
    }

    return state;
  }

  private calculateDelta(
    oldState: Record<string, any>,
    newState: Record<string, any>,
  ): Record<string, any> {
    const delta: Record<string, any> = {};

    // Find added/updated keys
    for (const key in newState) {
      if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
        delta[key] = newState[key];
      }
    }

    // Find deleted keys
    for (const key in oldState) {
      if (!(key in newState)) {
        delta[key] = null; // Mark as deleted
      }
    }

    return delta;
  }

  private applyDelta(
    state: Record<string, any>,
    delta: Record<string, any>,
  ): Record<string, any> {
    const newState = { ...state };

    for (const key in delta) {
      if (delta[key] === null) {
        delete newState[key];
      } else {
        newState[key] = delta[key];
      }
    }

    return newState;
  }

  private calculateSize(state: Record<string, any>): number {
    return JSON.stringify(state).length;
  }

  private async cleanupOldSnapshots(sessionId: string): Promise<void> {
    const count = await this.snapshotRepository.count({
      where: { sessionId },
    });

    if (count > this.MAX_SNAPSHOTS_PER_SESSION) {
      const toDelete = count - this.MAX_SNAPSHOTS_PER_SESSION;
      const oldSnapshots = await this.snapshotRepository.find({
        where: { sessionId, isRestorePoint: false },
        order: { createdAt: 'ASC' },
        take: toDelete,
      });

      await this.snapshotRepository.remove(oldSnapshots);
      this.logger.debug(
        `Cleaned up ${toDelete} old snapshots for session ${sessionId}`,
      );
    }
  }
}
