import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { UserSignal } from './interfaces/user-signal.interface';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private readonly namespace: string;

  constructor(private readonly configService: ConfigService) {
    this.namespace =
      this.configService.get<string>(
        'SEGMENTATION_REDIS_NAMESPACE',
        'segmentation',
      ) || 'segmentation';
  }

  async onModuleInit() {
    this.client = this.createRedisClient();
    try {
      await this.client.ping();
      this.logger.log('Connected to Redis for segmentation');
    } catch (error) {
      this.logger.error('Unable to connect to Redis', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /* -------------------------------------------------------------------------- */
  /* User signal cache                                                          */
  /* -------------------------------------------------------------------------- */

  signalKey(userId: string): string {
    return `${this.namespace}:user:${userId}`;
  }

  async getSignal(userId: string): Promise<UserSignal | null> {
    const raw = await this.connection.get(this.signalKey(userId));
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserSignal;
    } catch (error) {
      this.logger.warn(
        `Failed to parse cached signal for ${userId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async setSignal(
    signal: UserSignal,
    ttlSeconds = 24 * 60 * 60,
  ): Promise<void> {
    const payload = JSON.stringify({
      ...signal,
      updatedAt: new Date().toISOString(),
    });
    if (ttlSeconds > 0) {
      await this.connection.set(
        this.signalKey(signal.userId),
        payload,
        'EX',
        ttlSeconds,
      );
    } else {
      await this.connection.set(this.signalKey(signal.userId), payload);
    }
  }

  async deleteSignal(userId: string): Promise<number> {
    return this.connection.del(this.signalKey(userId));
  }

  /* -------------------------------------------------------------------------- */
  /* Size snapshots                                                             */
  /* -------------------------------------------------------------------------- */

  sizeKey(segmentId: string): string {
    return `${this.namespace}:size:${segmentId}`;
  }

  async getSize(segmentId: string): Promise<number | null> {
    const value = await this.connection.get(this.sizeKey(segmentId));
    if (value === null) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async setSize(segmentId: string, size: number): Promise<void> {
    await this.connection.set(this.sizeKey(segmentId), String(size));
  }

  /* -------------------------------------------------------------------------- */
  /* A/B assignments                                                            */
  /* -------------------------------------------------------------------------- */

  assignmentKey(experimentKey: string, userId: string): string {
    return `${this.namespace}:assignment:${experimentKey}:${userId}`;
  }

  async getAssignment(
    experimentKey: string,
    userId: string,
  ): Promise<string | null> {
    return this.connection.get(this.assignmentKey(experimentKey, userId));
  }

  async setAssignment(
    experimentKey: string,
    userId: string,
    variantKey: string,
  ): Promise<void> {
    await this.connection.set(
      this.assignmentKey(experimentKey, userId),
      variantKey,
    );
  }

  /* -------------------------------------------------------------------------- */

  private createRedisClient(): Redis {
    const url = this.configService.get<string>('REDIS_URL');
    const maxRetriesPerRequest = Number(
      this.configService.get<string>('REDIS_MAX_RETRIES_PER_REQUEST') || '3',
    );

    const baseOptions: RedisOptions = {
      enableOfflineQueue: true,
      enableReadyCheck: true,
      maxRetriesPerRequest,
      retryStrategy: (times: number) => Math.min(times * 100, 2000),
    };

    if (url) {
      return new Redis(url, baseOptions);
    }

    const password = this.configService.get<string>('REDIS_PASSWORD');
    return new Redis({
      ...baseOptions,
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.configService.get<string>('REDIS_PORT') || '6379'),
      password: password || undefined,
    });
  }

  private get connection(): Redis {
    if (!this.client) {
      throw new Error('Redis client has not been initialized');
    }
    return this.client;
  }
}
