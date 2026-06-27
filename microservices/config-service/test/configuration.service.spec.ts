import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Config, Environment } from '../src/entities';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuditLogService } from '../src/modules/audit/audit-log.service';
import { ValidationService } from '../src/common';
import { ConfigurationService } from '../src/modules/configuration/configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;

  const mockConfigRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEnvironmentRepository = {
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  const mockValidationService = {
    validateConfigKey: jest.fn(),
    validateConfigType: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigurationService,
        {
          provide: getRepositoryToken(Config),
          useValue: mockConfigRepository,
        },
        {
          provide: getRepositoryToken(Environment),
          useValue: mockEnvironmentRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
      ],
    }).compile();

    service = module.get<ConfigurationService>(ConfigurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConfig', () => {
    it('should create a new configuration', async () => {
      const createConfigDto = {
        key: 'TEST_KEY',
        value: 'test_value',
        type: 'string' as const,
      };

      const mockConfig = { id: '1', ...createConfigDto };
      mockConfigRepository.findOne.mockResolvedValue(null);
      mockConfigRepository.create.mockReturnValue(mockConfig);
      mockConfigRepository.save.mockResolvedValue(mockConfig);

      const result = await service.createConfig(createConfigDto);

      expect(result).toEqual(mockConfig);
      expect(mockConfigRepository.save).toHaveBeenCalled();
    });
  });
});
