import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface HintCacheStats {
  size: number;
  maxEntries: number;
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  hitRate: number;
}

/**
 * Small in-process cache for generated/selected hints.
 *
 * Hint selection is a read-heavy, mostly-deterministic operation: the same
 * (puzzle, order, context) tuple yields the same hint for a while. Caching the
 * resolved hint for a short TTL avoids re-querying templates and re-running the
 * ranking/scoring pass on every request, and the LRU bound keeps memory flat.
 *
 * The cache is deliberately dependency-free so it can be unit tested directly
 * and, if the deployment later needs a shared cache, the same interface can be
 * backed by Redis without touching callers.
 */
@Injectable()
export class HintCacheService {
  private readonly logger = new Logger(HintCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries = 500;
  private readonly defaultTtlMs = 60_000;

  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expirations += 1;
      this.misses += 1;
      return null;
    }

    // Refresh recency for LRU ordering.
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + Math.max(0, ttlMs),
    });
    this.enforceBound();
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate every cached entry belonging to a puzzle. Called when a hint
   * template for that puzzle is edited so stale content is never served.
   */
  invalidateByPrefix(prefix: string): number {
    let removed = 0;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  getStats(): HintCacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }

  /**
   * Build a stable cache key from a set of ordered parts, ignoring the parts
   * that should not affect the selected hint (for example raw user id).
   */
  buildKey(parts: Array<string | number | undefined | null>): string {
    return parts
      .map((part) => (part === undefined || part === null ? '-' : String(part)))
      .join(':');
  }

  private enforceBound(): void {
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next();
      if (oldest.done) break;
      this.store.delete(oldest.value);
      this.evictions += 1;
    }
  }

  /**
   * Remove expired entries. Exposed so a scheduled job can keep the map tidy
   * even when a key is never read again.
   */
  prune(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        this.expirations += 1;
        removed += 1;
      }
    }
    return removed;
  }
}
