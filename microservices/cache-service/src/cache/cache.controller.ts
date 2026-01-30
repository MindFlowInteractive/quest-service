import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CacheService } from './cache.service';

@Controller('cache')
export class CacheController {
  constructor(private readonly cache: CacheService) {}

  @Get('stats')
  async stats() {
    return this.cache.stats();
  }

  // Simple get endpoint demonstrating cache-aside. If missing, uses demo fetchFn.
  @Get(':key')
  async get(@Param('key') key: string, @Query('ttl') ttl?: string) {
    const ttlSec = ttl ? Number(ttl) : 60;
    const value = await this.cache.getOrSet(key, async () => {
      // demo fetch - replace with real DB/service lookup when integrating
      return { demo: `value-for-${key}`, generatedAt: Date.now() };
    }, ttlSec);
    return { key, value };
  }
  @Post('warm')
  async warm(@Body() body: { keys: string[]; ttl?: number }) {
    const { keys, ttl } = body;
    await this.cache.warm(keys || [], async (k: string) => {
      return { demo: `warmed-${k}`, ts: Date.now() };
    }, ttl || 300);
    return { warmed: keys.length };
  }

  @Post('invalidate')
  async invalidate(@Body() body: { key?: string; pattern?: string }) {
    if (body.key) {
      await this.cache.invalidate(body.key);
      return { invalidated: 1 };
    }
    if (body.pattern) {
      const found = await this.cache.invalidatePattern(body.pattern);
      return { invalidated: found };
    }
    return { invalidated: 0 };
  }

  @Post('lock/acquire')
  async acquireLock(@Body() body: { resource: string; ttl?: number }) {
    const lock = await this.cache.acquireLock(body.resource, body.ttl || 5000);
    if (!lock) return { acquired: false };
    return { acquired: true, lock };
  }

  @Post('lock/release')
  async releaseLock(@Body() body: { key: string; token: string }) {
    const ok = await this.cache.releaseLock({ key: body.key, token: body.token });
    return { released: Boolean(ok) };
  }
}
