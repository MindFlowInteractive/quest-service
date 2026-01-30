import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CacheService]
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterAll(async () => {
    await service.client.flushdb();
    await service.client.quit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrSet', () => {
    it('should store and retrieve values with cache-aside', async () => {
      const key = 'test:1';
      const value = { data: 'test' };
      let fetchCount = 0;

      const result = await service.getOrSet(
        key,
        async () => {
          fetchCount++;
          return value;
        },
        60
      );

      expect(result).toEqual(value);
      expect(fetchCount).toBe(1);

      // Second call should use cache
      const result2 = await service.getOrSet(
        key,
        async () => {
          fetchCount++;
          return value;
        },
        60
      );

      expect(result2).toEqual(value);
      expect(fetchCount).toBe(1); // not incremented
    });

    it('should track hits and misses', async () => {
      await service.client.del('cache:hits', 'cache:misses');

      await service.getOrSet('miss:1', async () => ({ v: 1 }), 60);
      await service.getOrSet('miss:1', async () => ({ v: 1 }), 60);

      const stats = await service.stats();
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe('invalidate', () => {
    it('should remove a single key', async () => {
      const key = 'inv:1';
      await service.set(key, { data: 'test' }, 60);
      let val = await service.client.get(key);
      expect(val).toBeDefined();

      await service.invalidate(key);
      val = await service.client.get(key);
      expect(val).toBeNull();
    });

    it('should invalidate keys by pattern', async () => {
      const keys = ['pat:1', 'pat:2', 'pat:3', 'other:1'];
      for (const k of keys) {
        await service.set(k, { data: k }, 60);
      }

      const count = await service.invalidatePattern('pat:*');
      expect(count).toBe(3);

      const other = await service.client.get('other:1');
      expect(other).toBeDefined();
    });
  });

  describe('warm', () => {
    it('should populate cache for multiple keys', async () => {
      const keys = ['warm:1', 'warm:2'];
      let fetchCount = 0;

      await service.warm(
        keys,
        async (k) => {
          fetchCount++;
          return { key: k };
        },
        60
      );

      expect(fetchCount).toBe(2);

      // Verify all keys exist
      for (const k of keys) {
        const val = await service.client.get(k);
        expect(val).toBeDefined();
      }
    });
  });

  describe('locks', () => {
    it('should acquire and release locks', async () => {
      const lock = await service.acquireLock('test-lock', 5000);
      expect(lock).toBeDefined();
      expect(lock?.key).toContain('locks:');
      expect(lock?.token).toBeDefined();

      const released = await service.releaseLock(lock);
      expect(released).toBe(true);
    });

    it('should fail concurrent lock acquisition', async () => {
      const lock1 = await service.acquireLock('concurrent', 5000);
      expect(lock1).toBeDefined();

      // Try to acquire same resource while locked
      const lock2 = await service.acquireLock('concurrent', 500);
      expect(lock2).toBeNull();

      // Release first lock
      await service.releaseLock(lock1);

      // Now acquire should succeed
      const lock3 = await service.acquireLock('concurrent', 5000);
      expect(lock3).toBeDefined();
      await service.releaseLock(lock3);
    });

    it('should handle already-expired locks gracefully', async () => {
      const lock = await service.acquireLock('expired', 100);
      expect(lock).toBeDefined();

      // Wait for expiry
      await new Promise((r) => setTimeout(r, 150));

      // Release should still return true (key already gone)
      const released = await service.releaseLock(lock);
      expect(released).toBe(true);
    });
  });
});
