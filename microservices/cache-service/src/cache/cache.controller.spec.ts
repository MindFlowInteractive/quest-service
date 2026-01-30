import { Test, TestingModule } from '@nestjs/testing';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';

describe('CacheController', () => {
  let controller: CacheController;
  let service: CacheService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [CacheService]
    }).compile();

    controller = module.get<CacheController>(CacheController);
    service = module.get<CacheService>(CacheService);
  });

  afterAll(async () => {
    await service.client.flushdb();
    await service.client.quit();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /:key', () => {
    it('should retrieve or set a cache value', async () => {
      const result = await controller.get('ctrl:1');
      expect(result.key).toBe('ctrl:1');
      expect(result.value).toBeDefined();
      expect(result.value.demo).toContain('ctrl:1');
    });
  });

  describe('POST /warm', () => {
    it('should warm multiple keys', async () => {
      const result = await controller.warm({
        keys: ['warm:ctrl:1', 'warm:ctrl:2'],
        ttl: 60
      });
      expect(result.warmed).toBe(2);
    });
  });

  describe('POST /invalidate', () => {
    it('should invalidate a single key', async () => {
      await controller.get('inv:ctrl:1');
      const result = await controller.invalidate({ key: 'inv:ctrl:1' });
      expect(result.invalidated).toBe(1);
    });

    it('should invalidate by pattern', async () => {
      await controller.warm({
        keys: ['pat:ctrl:1', 'pat:ctrl:2'],
        ttl: 60
      });
      const result = await controller.invalidate({ pattern: 'pat:ctrl:*' });
      expect(result.invalidated).toBeGreaterThan(0);
    });
  });

  describe('GET /stats', () => {
    it('should return cache statistics', async () => {
      await service.client.del('cache:hits', 'cache:misses');
      await controller.get('stat:1');
      await controller.get('stat:1');

      const result = await controller.stats();
      expect(result.hits).toBeGreaterThanOrEqual(0);
      expect(result.misses).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /lock/acquire and /release', () => {
    it('should acquire and release locks', async () => {
      const acq = await controller.acquireLock({
        resource: 'test',
        ttl: 5000
      });
      expect(acq.acquired).toBe(true);
      expect(acq.lock).toBeDefined();

      const rel = await controller.releaseLock({
        key: acq.lock.key,
        token: acq.lock.token
      });
      expect(rel.released).toBe(true);
    });

    it('should fail concurrent lock acquire', async () => {
      const acq1 = await controller.acquireLock({
        resource: 'concurrent',
        ttl: 5000
      });
      expect(acq1.acquired).toBe(true);

      const acq2 = await controller.acquireLock({
        resource: 'concurrent',
        ttl: 500
      });
      expect(acq2.acquired).toBe(false);

      await controller.releaseLock({
        key: acq1.lock.key,
        token: acq1.lock.token
      });
    });
  });
});
