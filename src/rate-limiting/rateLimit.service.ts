import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RateLimitService {
  private redis = new Redis();

  private limits = {
    free: { requests: 100, window: 60 }, // 100/min
    premium: { requests: 1000, window: 60 }, // 1000/min
  };

  async checkLimit(userId: string, endpoint: string, tier: 'free' | 'premium') {
    const key = `rate:${userId}:${endpoint}`;
    const now = Date.now();
    const window = this.limits[tier].window * 1000;

    // Sliding window: remove old requests
    await this.redis.zremrangebyscore(key, 0, now - window);

    // Count requests in window
    const count = await this.redis.zcard(key);

    if (count >= this.limits[tier].requests) {
      return { allowed: false, remaining: 0 };
    }

    // Add current request
    await this.redis.zadd(key, now, `${userId}-${now}`);
    await this.redis.expire(key, this.limits[tier].window);

    return { allowed: true, remaining: this.limits[tier].requests - count - 1 };
  }
}
