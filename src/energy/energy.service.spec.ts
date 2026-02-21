/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EnergyService } from './energy.service';
import { UserEnergy } from './entities/user-energy.entity';
import { EnergyTransaction } from './entities/energy-transaction.entity';
import { EnergyGift } from './entities/energy-gift.entity';
import { EnergyBoost } from './entities/energy-boost.entity';
import { User } from '../users/entities/user.entity';
import { NotificationService } from '../notifications/notification.service';
import energyConfig from './config/energy.config';

describe('EnergyService', () => {
  let service: EnergyService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    })),
  };

  const mockNotificationService = {
    createNotificationForUsers: jest.fn(),
  };

  const mockConfig = {
    defaultCurrentEnergy: 100,
    defaultMaxEnergy: 100,
    defaultRegenerationRate: 1,
    defaultRegenerationIntervalMinutes: 30,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnergyService,
        {
          provide: getRepositoryToken(UserEnergy),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EnergyTransaction),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EnergyGift),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(EnergyBoost),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: energyConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<EnergyService>(EnergyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeUserEnergy', () => {
    it('should create new user energy if not exists', async () => {
      const userId = 'user-123';
      const mockUserEnergy = { userId, currentEnergy: 100, maxEnergy: 100 };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUserEnergy);
      mockRepository.save.mockResolvedValue(mockUserEnergy);

      const result = await service.initializeUserEnergy(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUserEnergy);
    });

    it('should return existing user energy if exists', async () => {
      const userId = 'user-123';
      const existingUserEnergy = { userId, currentEnergy: 50, maxEnergy: 100 };

      mockRepository.findOne.mockResolvedValue(existingUserEnergy);

      const result = await service.initializeUserEnergy(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { userId } });
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingUserEnergy);
    });
  });
});