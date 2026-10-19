import { HintCacheService } from './hint-cache.service';

describe('HintCacheService', () => {
  let cache: HintCacheService;

  beforeEach(() => {
    cache = new HintCacheService();
  });

  it('stores and retrieves values', () => {
    cache.set('key', { content: 'look at the corners' });
    expect(cache.get('key')).toEqual({ content: 'look at the corners' });
    expect(cache.getStats().hits).toBe(1);
  });

  it('returns null and counts a miss for unknown keys', () => {
    expect(cache.get('missing')).toBeNull();
    expect(cache.getStats().misses).toBe(1);
  });

  it('expires entries after their ttl', () => {
    cache.set('key', 'value', 0);
    expect(cache.get('key')).toBeNull();
    expect(cache.getStats().expirations).toBe(1);
  });

  it('refreshes recency on read', () => {
    const small = new HintCacheService();
    (small as any).maxEntries = 2;

    small.set('a', 1);
    small.set('b', 2);
    expect(small.get('a')).toBe(1); // 'a' becomes most recently used

    small.set('c', 3); // evicts 'b'
    expect(small.get('a')).toBe(1);
    expect(small.get('b')).toBeNull();
    expect(small.get('c')).toBe(3);
  });

  it('evicts the oldest entry when full', () => {
    const small = new HintCacheService();
    (small as any).maxEntries = 1;

    small.set('a', 1);
    small.set('b', 2);

    expect(small.get('a')).toBeNull();
    expect(small.get('b')).toBe(2);
    expect(small.getStats().evictions).toBeGreaterThanOrEqual(1);
  });

  it('invalidates every entry for a puzzle prefix', () => {
    cache.set(cache.buildKey(['hint', 'puzzle-1', 1]), 'a');
    cache.set(cache.buildKey(['hint', 'puzzle-1', 2]), 'b');
    cache.set(cache.buildKey(['hint', 'puzzle-2', 1]), 'c');

    expect(cache.invalidateByPrefix('hint:puzzle-1')).toBe(2);
    expect(cache.get('hint:puzzle-1:1')).toBeNull();
    expect(cache.get('hint:puzzle-2:1')).toBe('c');
  });

  it('builds stable keys and normalises nullish parts', () => {
    expect(cache.buildKey(['hint', 'puzzle-1', undefined, 3, null])).toBe(
      'hint:puzzle-1:-:3:-',
    );
  });

  it('prunes expired entries on demand', () => {
    cache.set('expired', 1, 0);
    cache.set('fresh', 2, 60_000);

    expect(cache.prune()).toBe(1);
    expect(cache.size).toBe(1);
  });

  it('reports a hit rate', () => {
    cache.set('a', 1);
    cache.get('a');
    cache.get('missing');

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('clears all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
