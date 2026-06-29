import { Test, TestingModule } from '@nestjs/testing';
import { DevicesController } from '../devices.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Device } from '../entities/device.entity';
import { BadRequestException } from '@nestjs/common';

describe('DevicesController', () => {
  let controller: DevicesController;
  let mockDeviceRepo: any;

  const mockUser = { userId: 'user-123', email: 'test@test.com' };

  beforeEach(async () => {
    mockDeviceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((d) => Promise.resolve({ ...d, id: 'device-1' })),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DevicesController],
      providers: [
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
      ],
    }).compile();

    controller = module.get<DevicesController>(DevicesController);
  });

  describe('register', () => {
    it('should register a new device token', async () => {
      mockDeviceRepo.findOne.mockResolvedValue(null);
      const result = await controller.register(mockUser, { token: 'fcm-token-1', platform: 'ios' as any });
      expect(result.ok).toBe(true);
      expect(mockDeviceRepo.save).toHaveBeenCalled();
    });

    it('should upsert if token already exists', async () => {
      mockDeviceRepo.findOne.mockResolvedValue({ id: 'existing', token: 'fcm-token-1', userId: 'other-user', platform: 'android' });
      const result = await controller.register(mockUser, { token: 'fcm-token-1', platform: 'ios' as any });
      expect(result.ok).toBe(true);
      expect(mockDeviceRepo.save).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123', platform: 'ios' }));
    });

    it('should reject if user already has 10 tokens', async () => {
      mockDeviceRepo.findOne.mockResolvedValue(null);
      mockDeviceRepo.count.mockResolvedValue(10);
      await expect(controller.register(mockUser, { token: 'fcm-token-new', platform: 'ios' as any }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deregister', () => {
    it('should delete token for authenticated user', async () => {
      const result = await controller.deregister(mockUser, 'fcm-token-1');
      expect(mockDeviceRepo.delete).toHaveBeenCalledWith({ token: 'fcm-token-1', userId: 'user-123' });
      expect(result.ok).toBe(true);
    });
  });

  describe('list', () => {
    it('should return devices for authenticated user', async () => {
      mockDeviceRepo.find.mockResolvedValue([{ id: 'd1', token: 'tok1', platform: 'ios' }]);
      const result = await controller.list(mockUser);
      expect(result.ok).toBe(true);
      expect(result.devices).toHaveLength(1);
      expect(mockDeviceRepo.find).toHaveBeenCalledWith({ where: { userId: 'user-123' } });
    });
  });
});
