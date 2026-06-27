import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly entries = new Map<string, CacheItem<unknown>>();
  private readonly ttlMs: number;

  constructor(config: NestConfigService) {
    this.ttlMs = Math.max(1, config.get<number>('CACHE_TTL_SECONDS', 60)) * 1000;
  }

  get<T>(key: string): T | undefined {
    const item = this.entries.get(key);
    if (!item) return undefined;
    if (item.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return item.value as T;
  }

  set<T>(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
