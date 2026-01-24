import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Session } from '../entities/session.entity';
import { StateSnapshot } from '../entities/state.entity';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly SNAPSHOT_TTL = 1800; // 30 minutes

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      'redis://:redis123@localhost:6379';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    await this.redis.connect();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  // Session caching
  async setSession(session: Session): Promise<void> {
    const key = `session:${session.sessionId}`;
    await this.redis.setex(
      key,
      this.SESSION_TTL,
      JSON.stringify(session),
    );

    // Also index by userId for active session lookup
    if (session.status === 'ACTIVE') {
      await this.redis.setex(
        `user:${session.userId}:active_session`,
        this.SESSION_TTL,
        session.sessionId,
      );
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as Session;
    } catch (error) {
      this.logger.error(`Error parsing cached session: ${sessionId}`, error);
      return null;
    }
  }

  async getActiveSession(userId: string): Promise<Session | null> {
    const sessionId = await this.redis.get(`user:${userId}:active_session`);
    if (!sessionId) {
      return null;
    }

    return this.getSession(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    const session = await this.getSession(sessionId);

    if (session) {
      // Delete user index
      await this.redis.del(`user:${session.userId}:active_session`);
    }

    await this.redis.del(key);
  }

  async updateSessionTTL(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.redis.expire(key, this.SESSION_TTL);
  }

  // Snapshot caching
  async setLatestSnapshot(
    sessionId: string,
    snapshot: StateSnapshot,
  ): Promise<void> {
    const key = `snapshot:${sessionId}:latest`;
    await this.redis.setex(
      key,
      this.SNAPSHOT_TTL,
      JSON.stringify(snapshot),
    );
  }

  async getLatestSnapshot(sessionId: string): Promise<StateSnapshot | null> {
    const key = `snapshot:${sessionId}:latest`;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as StateSnapshot;
    } catch (error) {
      this.logger.error(
        `Error parsing cached snapshot for session: ${sessionId}`,
        error,
      );
      return null;
    }
  }

  async deleteSnapshot(sessionId: string): Promise<void> {
    const key = `snapshot:${sessionId}:latest`;
    await this.redis.del(key);
  }

  // Health check
  async ping(): Promise<string> {
    return this.redis.ping();
  }
}
