import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ICacheService } from '../../domain/repositories/repository-interfaces';

/**
 * Redis implementation of cache service
 */
@Injectable()
export class RedisCacheService implements ICacheService {
  constructor(private redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttl) {
      await this.redisClient.setex(key, ttl, serialized);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.redisClient.mget(...keys);
    return values.map((v) => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return null;
      }
    });
  }

  async mset(records: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    const pipeline = this.redisClient.pipeline();

    for (const { key, value, ttl } of records) {
      const serialized = JSON.stringify(value);
      if (ttl) {
        pipeline.setex(key, ttl, serialized);
      } else {
        pipeline.set(key, serialized);
      }
    }

    await pipeline.exec();
  }

  async sadd(key: string, members: string[]): Promise<number> {
    return this.redisClient.sadd(key, ...members);
  }

  async srem(key: string, members: string[]): Promise<number> {
    return this.redisClient.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.redisClient.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.redisClient.sismember(key, member);
    return result === 1;
  }

  async zadd(
    key: string,
    members: Array<{ score: number; member: string }>,
  ): Promise<number> {
    const args: (string | number)[] = [];
    for (const { score, member } of members) {
      args.push(score, member);
    }
    return this.redisClient.zadd(key, ...args);
  }

  async zrem(key: string, members: string[]): Promise<number> {
    return this.redisClient.zrem(key, ...members);
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<(string | number)[]> {
    if (withScores) {
      return this.redisClient.zrange(key, start, stop, 'WITHSCORES');
    }
    return this.redisClient.zrange(key, start, stop);
  }

  async zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<(string | number)[]> {
    if (withScores) {
      return this.redisClient.zrevrange(key, start, stop, 'WITHSCORES');
    }
    return this.redisClient.zrevrange(key, start, stop);
  }

  async zcard(key: string): Promise<number> {
    return this.redisClient.zcard(key);
  }

  async zcount(key: string, min: number, max: number): Promise<number> {
    return this.redisClient.zcount(key, min, max);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }

  async zinterstore(destination: string, keys: string[]): Promise<number> {
    return this.redisClient.zinterstore(destination, keys.length, ...keys) as any;
  }

  async zrangebyscore(
    key: string,
    min: number,
    max: number,
    limit?: { offset: number; count: number },
  ): Promise<string[]> {
    if (limit) {
      return this.redisClient.zrangebyscore(
        key,
        min,
        max,
        'LIMIT',
        limit.offset,
        limit.count,
      );
    }
    return this.redisClient.zrangebyscore(key, min, max);
  }
}
