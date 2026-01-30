import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  // no external redlock library; use simple Redis-based locks

  constructor() {
    const url = process.env.REDIS_URL || 'redis://redis:6379';
    const maxRetriesPerRequest =
      process.env.NODE_ENV === 'production' ? 20 : 3;
    this.redis = new Redis(url, {
      maxRetriesPerRequest,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.log('Connected to Redis');
    } catch (err) {
      this.logger.error('Redis connection failed', err as any);
      throw err;
    }
  }

  // Cache-aside: get value or fetch and set
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const raw = await this.redis.get(key);
    if (raw != null) {
      await this.redis.incr('cache:hits');
      try {
        return JSON.parse(raw) as T;
      } catch (e) {
        return (raw as unknown) as T;
      }
    }

    await this.redis.incr('cache:misses');
    const fresh = await fetchFn();
    await this.redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
    return fresh;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidate(key: string) {
    await this.redis.del(key);
  }

  // Invalidate keys by pattern (uses scan to avoid blocking)
  async invalidatePattern(pattern: string) {
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    const pipeline = this.redis.pipeline();
    let found = 0;
    for await (const keys of stream) {
      if (keys.length) {
        keys.forEach((k: string) => pipeline.del(k));
        found += keys.length;
      }
    }
    if (found) await pipeline.exec();
    return found;
  }

  // Warm cache for a list of keys using provided fetchFn(key)
  async warm(keys: string[], fetchFn: (key: string) => Promise<any>, ttlSeconds = 300) {
    for (const k of keys) {
      const exists = await this.redis.exists(k);
      if (!exists) {
        try {
          const v = await fetchFn(k);
          await this.set(k, v, ttlSeconds);
        } catch (e) {
          this.logger.warn(`Warming failed for ${k}: ${e}`);
        }
      }
    }
  }

  // Simple distributed lock using SET NX PX and a release Lua script
  private makeToken() {
    return `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // Attempts to acquire lock, returns { key, token } or null
  async acquireLock(resource: string, ttl = 5000, retryDelay = 100, retryCount = 50) {
    const key = `locks:${resource}`;
    const token = this.makeToken();
    const setLua = `if redis.call('set', KEYS[1], ARGV[1], 'PX', ARGV[2], 'NX') then return 1 else return 0 end`;
    for (let i = 0; i < retryCount; i++) {
      try {
        const ok: any = await this.redis.eval(setLua, 1, key, token, String(ttl));
        if (Number(ok) === 1) {
          // verify written (poll briefly as Redis may be fast but async under some clients)
          const maxCheckMs = 100;
          const start = Date.now();
          while (Date.now() - start < maxCheckMs) {
            const stored = await this.redis.get(key);
            if (stored === token) return { key, token };
            await new Promise((r) => setTimeout(r, 10));
          }
          // if not visible, treat as failure and retry
        }
      } catch (e) {
        this.logger.warn('acquireLock eval error', (e as any).message);
      }
      await new Promise((r) => setTimeout(r, retryDelay));
    }
    return null;
  }

  async releaseLock(lock: { key: string; token: string } | null) {
    if (!lock) return false;
    const lua = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
    try {
      const res: any = await this.redis.eval(lua, 1, lock.key, lock.token);
      if (Number(res) === 1) return true;
      // res == 0 means either key doesn't exist or value mismatched.
      const exists = await this.redis.exists(lock.key);
      if (exists === 0) return true; // already expired/removed — consider released
      return false;
    } catch (e) {
      this.logger.warn('Failed to release lock', (e as any).message);
      return false;
    }
  }

  async stats() {
    const [hits, misses] = await this.redis.mget('cache:hits', 'cache:misses');
    return { hits: Number(hits || '0'), misses: Number(misses || '0') };
  }

  // Expose underlying Redis for admin tasks
  get client() {
    return this.redis;
  }
}
