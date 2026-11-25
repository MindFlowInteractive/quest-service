import type Redis from 'ioredis';
import { CacheService } from './cache.service';
import type { CacheMonitoringService } from './cache-monitoring.service';

const CONFIG = {
  redis: {
    keyPrefix: 'app:',
    defaultTtl: 3600,
    maxRetries: 3,
    retryDelay: 1000,
  },
  layers: {
    l1: { enabled: true, maxSize: 100, ttl: 300 },
    l2: { enabled: true, ttl: 3600 },
  },
  monitoring: {
    enabled: true,
    metricsInterval: 60000,
    alertThresholds: { hitRatio: 0.8, responseTime: 100, errorRate: 0.05 },
  },
  backup: { enabled: false, interval: 3600000, retention: 7 },
  warming: { enabled: false, strategies: ['popular'], batchSize: 100 },
};

interface RedisMock {
  get: jest.Mock;
  setex: jest.Mock;
  del: jest.Mock;
  smembers: jest.Mock;
  sadd: jest.Mock;
  srem: jest.Mock;
  keys: jest.Mock;
  exists: jest.Mock;
  publish: jest.Mock;
  subscribe: jest.Mock;
  pipeline: jest.Mock;
  on: jest.Mock;
}

function createRedisMock(): RedisMock {
  return {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    pipeline: jest.fn(() => ({
      sadd: jest.fn(),
      srem: jest.fn(),
      exec: jest.fn(),
    })),
    on: jest.fn(),
  };
}

function createMonitoringMock(): CacheMonitoringService {
  return {
    recordHit: jest.fn(),
    recordMiss: jest.fn(),
    recordSet: jest.fn(),
    recordDelete: jest.fn(),
    recordError: jest.fn(),
    getMetrics: jest.fn(),
  } as unknown as CacheMonitoringService;
}

describe('CacheService', () => {
  let redis: RedisMock;
  let monitoring: CacheMonitoringService;
  let service: CacheService;

  beforeEach(() => {
    redis = createRedisMock();
    monitoring = createMonitoringMock();
    service = new CacheService(redis as unknown as Redis, CONFIG as any, monitoring);
    redis.get.mockResolvedValue(null);
    redis.setex.mockResolvedValue('OK');
    redis.smembers.mockResolvedValue([]);
    redis.keys.mockResolvedValue([]);
  });

  describe('set / get round trip', () => {
    it('stores values in L1 and L2 and records metrics', async () => {
      const value = { name: 'Alice', score: 42 };
      await service.set('user:1', value);

      expect(redis.setex).toHaveBeenCalledWith('app:user:1', 3600, expect.anything());
      expect(monitoring.recordSet).toHaveBeenCalled();

      // L1 is populated, so the next get is an L1 hit.
      expect(await service.get('user:1')).toEqual(value);
      expect(monitoring.recordHit).toHaveBeenCalledWith('l1', expect.any(Number));
    });

    it('reads L2 and populates L1 on L2 hits', async () => {
      redis.get.mockResolvedValue(JSON.stringify({ name: 'Bob' }));

      expect(await service.get('user:2')).toEqual({ name: 'Bob' });
      expect(monitoring.recordHit).toHaveBeenCalledWith('l2', expect.any(Number));

      // Second read is served from L1 now.
      redis.get.mockClear();
      expect(await service.get('user:2')).toEqual({ name: 'Bob' });
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('records a miss when nothing is cached', async () => {
      expect(await service.get('missing')).toBeNull();
      expect(monitoring.recordMiss).toHaveBeenCalled();
    });

    it('honors the per-key TTL on L2', async () => {
      await service.set('user:4', 'value', { ttl: 42 });
      expect(redis.setex).toHaveBeenCalledWith('app:user:4', 42, expect.anything());
    });
  });

  describe('compression', () => {
    it('stores compressed values and deserializes them on read', async () => {
      const value = { data: 'x'.repeat(500) };
      await service.set('big:1', value, { compress: true });

      const stored = redis.setex.mock.calls[0][2];
      expect(Buffer.isBuffer(stored)).toBe(true);
      expect(stored[0]).toBe(0x1f);
      expect(stored[1]).toBe(0x8b);

      const other = new CacheService(redis as unknown as Redis, CONFIG as any, monitoring);
      redis.get.mockResolvedValue(stored);
      expect(await other.get('big:1')).toEqual(value);
    });

    it('reads uncompressed values stored without compression', async () => {
      const plain = JSON.stringify({ data: 'plain' });
      redis.get.mockResolvedValue(plain);
      expect(await service.get('plain:1')).toEqual({ data: 'plain' });
    });
  });

  describe('invalidation', () => {
    it('deletes from L1 and Redis on delete()', async () => {
      await service.set('user:3', { x: 1 });
      await service.delete('user:3');

      expect(redis.del).toHaveBeenCalledWith('app:user:3');
      expect((service as unknown as { l1Cache: { has(k: string): boolean } }).l1Cache.has('app:user:3')).toBe(false);
      expect(await service.get('user:3')).toBeNull();
    });

    it('deletes keys on deleteByTag()', async () => {
      redis.smembers.mockResolvedValue(['app:user:1']);
      await service.deleteByTag('user');
      expect(redis.del).toHaveBeenCalledWith('app:user:1');
    });

    it('clears L1 and L2 on clear()', async () => {
      await service.set('user:1', { a: 1 });
      redis.keys.mockResolvedValue(['app:user:1']);
      await service.clear();
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('distributed sync', () => {
    it('publishes a set message when a value is cached', async () => {
      await service.set('user:5', { n: 1 });
      const [channel, message] = redis.publish.mock.calls[0];
      expect(channel).toBe('app:invalidations');
      const parsed = JSON.parse(message);
      expect(parsed.op).toBe('set');
      expect(parsed.keys).toContain('app:user:5');
    });

    it('drops L1 entries for deleted keys when another instance invalidates', () => {
      const l1 = (service as unknown as { l1Cache: { has(k: string): boolean; set(k: string, v: unknown): void } }).l1Cache;
      l1.set('app:user:9', 'v');
      const messageHandler = redis.on.mock.calls.find((c) => c[0] === 'message')![1];
      messageHandler('app:invalidations', JSON.stringify({ op: 'delete', keys: ['app:user:9'] }));
      expect(l1.has('app:user:9')).toBe(false);
    });

    it('clears L1 on a clear message from another instance', () => {
      const l1 = (service as unknown as { l1Cache: { has(k: string): boolean; set(k: string, v: unknown): void; size: number } }).l1Cache;
      l1.set('app:user:9', 'v');
      const messageHandler = redis.on.mock.calls.find((c) => c[0] === 'message')![1];
      messageHandler('app:invalidations', JSON.stringify({ op: 'clear', keys: [] }));
      expect(l1.size).toBe(0);
    });
  });
});
