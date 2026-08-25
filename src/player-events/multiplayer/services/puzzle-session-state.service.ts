import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PuzzleSessionStatus } from '../enums/puzzle-session-status.enum';
import { PuzzleSessionState } from '../interfaces/puzzle-session-state.interface';

@Injectable()
export class PuzzleSessionStateService {
  private readonly redis: Redis;
  private readonly prefix = 'puzzle:session:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  private key(sessionId: string) {
    return `${this.prefix}${sessionId}:state`;
  }

  async get(sessionId: string): Promise<PuzzleSessionState | null> {
    const value = await this.redis.get(this.key(sessionId));
    return value ? (JSON.parse(value) as PuzzleSessionState) : null;
  }

  async set(state: PuzzleSessionState, ttlSeconds = 7200) {
    state.updatedAt = new Date().toISOString();
    await this.redis.set(
      this.key(state.sessionId),
      JSON.stringify(state),
      'EX',
      ttlSeconds,
    );
  }

  async delete(sessionId: string) {
    await this.redis.del(this.key(sessionId));
  }

  async mutate(
    sessionId: string,
    expectedVersion: number | undefined,
    mutation: (state: PuzzleSessionState) => void,
  ): Promise<PuzzleSessionState> {
    const state = await this.get(sessionId);
    if (!state) throw new Error('ACTIVE_SESSION_STATE_NOT_FOUND');

    if (
      expectedVersion !== undefined &&
      expectedVersion !== state.version
    ) {
      throw new Error(`STALE_SESSION_STATE:${state.version}`);
    }

    mutation(state);
    state.version += 1;
    await this.set(state);
    return state;
  }

  async create(
    sessionId: string,
    puzzleId: string,
    status: PuzzleSessionStatus = PuzzleSessionStatus.WAITING,
  ) {
    const state: PuzzleSessionState = {
      sessionId,
      puzzleId,
      version: 0,
      status,
      players: {},
      sharedProgress: {
        completedSteps: [],
        discoveredHints: [],
        solvedSteps: [],
      },
      partialSolutions: {},
      updatedAt: new Date().toISOString(),
    };

    await this.set(state);
    return state;
  }
}
