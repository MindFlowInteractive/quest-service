import { Test, TestingModule } from '@nestjs/testing';
import { CacheWarmingService } from './cache-warming.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PreloadData } from './entities/preload-data.entity';
import { CacheJob } from './entities/cache-job.entity';
import { Metric } from './entities/metric.entity';
import { RedisCacheService } from './redis-cache.service';

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({}),
  };

  const mockRedisCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmingService,
        {
          provide: getRepositoryToken(PreloadData),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CacheJob),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Metric),
          useValue: mockRepository,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheWarmingService>(CacheWarmingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate popularity score correctly', () => {
    const preloadData = {
      accessCount: 100,
      hitCount: 85,
      missCount: 15,
      priority: 50,
      lastAccessedAt: new Date(),
      warmWindow: 'ALWAYS',
      isActive: true,
    } as PreloadData;

    const score = service['calculatePopularityScore'](preloadData);
    expect(score).toBeGreaterThan(0);
  });
});