import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class NotificationAggregationService {
  private readonly redis: Redis;
  private readonly windowSeconds = Number(
    process.env.NOTIFICATION_AGGREGATION_WINDOW_SECONDS ?? 30,
  );

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async increment(
    userId: string,
    aggregateKey: string,
  ): Promise<number> {
    const key = `notification:aggregate:${userId}:${aggregateKey}`;

    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    return count;
  }

  async getCount(
    userId: string,
    aggregateKey: string,
  ): Promise<number> {
    const key = `notification:aggregate:${userId}:${aggregateKey}`;
    const value = await this.redis.get(key);

    return value ? Number(value) : 0;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
