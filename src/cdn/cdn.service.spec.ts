import { Test, TestingModule } from '@nestjs/testing';
import { CdnService } from './cdn.service';

const config = {
  primaryUrl: 'https://cdn.example.com',
  fallbackUrl: 'https://fallback.example.com',
  provider: 'generic',
  purgeUrl: '',
  purgeToken: '',
  defaultTtlSeconds: 3600,
  staleWhileRevalidateSeconds: 300,
};

describe('CdnService', () => {
  let service: CdnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CdnService,
        { provide: 'CONFIGURATION(cdn)', useValue: config },
      ],
    }).compile();

    service = module.get(CdnService);
  });

  it('creates versioned CDN URLs with immutable caching', () => {
    const asset = service.resolveAsset('/puzzles/one.png', 'abc123');

    expect(asset.url).toBe('https://cdn.example.com/puzzles/one.png?v=abc123');
    expect(asset.cacheControl).toContain('immutable');
    expect(asset.etag).toBe('"puzzles/one.png:abc123"');
  });

  it('records cache metrics', () => {
    service.recordRequest(true);
    service.recordRequest(false);

    expect(service.getMetrics()).toMatchObject({
      requests: 2,
      cacheHits: 1,
      cacheMisses: 1,
    });
  });

  it('deduplicates purge keys when no provider endpoint is configured', async () => {
    await expect(service.purge(['a.png', 'a.png', ' b.png '])).resolves.toEqual({
      purged: 2,
      failed: false,
    });
  });

  it('uses the fallback CDN when the primary is unavailable', async () => {
    jest.spyOn((service as any).httpClient, 'head').mockRejectedValue(new Error('offline'));

    await expect(service.healthCheck()).resolves.toEqual({
      available: true,
      url: config.fallbackUrl,
    });
    expect(service.getMetrics().failoverRequests).toBe(1);
  });
});
