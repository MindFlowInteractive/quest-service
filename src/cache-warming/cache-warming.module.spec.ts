import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { CacheWarmingModule } from './cache-warming.module';
import { CacheWarmingService } from './cache-warming.service';
import { CacheWarmingScheduler } from './cache-warming.scheduler';
import { RedisCacheService } from './redis-cache.service';
import { CacheWarmingController } from './cache-warming.controller';
import { CacheJob } from './entities/cache-job.entity';
import { Metric } from './entities/metric.entity';
import { PreloadData } from './entities/preload-data.entity';

describe('CacheWarmingModule', () => {
  let module: TestingModule;

  const mockRepository = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({}),
  };

  const mockRedisCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    getStats: jest.fn().mockResolvedValue({ hits: 0, misses: 0, hitRate: 0 }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [],
      providers: [
        CacheWarmingModule,
        CacheWarmingService,
        CacheWarmingScheduler,
        RedisCacheService,
        CacheWarmingController,
        {
          provide: getRepositoryToken(CacheJob),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Metric),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PreloadData),
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
  });

  it('should export all required providers', () => {
    // Verify that the module defines all necessary providers
    const moduleMetadata = Reflect.getMetadata('providers', CacheWarmingModule);
    expect(moduleMetadata).toContain(CacheWarmingService);
    expect(moduleMetadata).toContain(CacheWarmingScheduler);
    expect(moduleMetadata).toContain(RedisCacheService);
  });

  it('should have all controllers defined', () => {
    const moduleMetadata = Reflect.getMetadata('controllers', CacheWarmingModule);
    expect(moduleMetadata).toContain(CacheWarmingController);
  });

  it('should import TypeOrmModule with correct entities', () => {
    const moduleMetadata = Reflect.getMetadata('imports', CacheWarmingModule);
    const typeOrmModuleImport = moduleMetadata.find(imp => imp.imports && imp.imports[0]?.name === 'TypeOrmModule');
    expect(typeOrmModuleImport).toBeDefined();
  });

  it('should export CacheWarmingService', () => {
    const moduleMetadata = Reflect.getMetadata('exports', CacheWarmingModule);
    expect(moduleMetadata).toContain(CacheWarmingService);
  });
});