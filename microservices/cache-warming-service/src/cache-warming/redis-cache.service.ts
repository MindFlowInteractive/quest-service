import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export interface RedisCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  warmingHits: number;
  warmingMisses: number;
}

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.redis = this.createRedisClient();

    try {
      await this.redis.ping();
      this.logger.log('Connected to Redis for cache warming');
    } catch (error) {
      this.logger.error('Unable to connect to Redis', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async deleteKey(key: string): Promise<number> {
    return this.client.del(key);
  }

  async deleteKeys(keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    return this.client.del(...keys);
  }

  async deletePattern(pattern: string): Promise<number> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    const pipeline = this.client.pipeline();
    let found = 0;

    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length > 0) {
        keys.forEach((key) => pipeline.del(key));
        found += keys.length;
      }
    }

    if (found > 0) {
      await pipeline.exec();
    }

    return found;
  }

  async increment(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async getStats(): Promise<RedisCacheStats> {
    const [sharedHits, sharedMisses, warmingHits, warmingMisses] =
      await this.client.mget(
        'cache:hits',
        'cache:misses',
        'cache-warming:hits',
        'cache-warming:misses',
      );
    const hits = Number(sharedHits || '0') + Number(warmingHits || '0');
    const misses = Number(sharedMisses || '0') + Number(warmingMisses || '0');
    const total = hits + misses;

    return {
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
      warmingHits: Number(warmingHits || '0'),
      warmingMisses: Number(warmingMisses || '0'),
    };
  }

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

  private get client(): Redis {
    if (!this.redis) {
      throw new Error('Redis client has not been initialized');
    }

    return this.redis;
  }
}
