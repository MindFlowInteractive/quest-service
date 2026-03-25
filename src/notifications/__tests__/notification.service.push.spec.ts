import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { Device } from '../entities/device.entity';
import { User } from '../../users/entities/user.entity';
import { EmailService } from '../email.service';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('NotificationService - Push Emission', () => {
  let service: NotificationService;
  let mockNotificationClient: any;
  let mockUserRepo: any;
  let mockDeviceRepo: any;

  const mockRepo = () => ({
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ ...d, id: 'notif-1' })),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  });

  beforeEach(async () => {
    mockNotificationClient = { emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }) };
    mockUserRepo = mockRepo();
    mockDeviceRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useFactory: mockRepo },
        { provide: getRepositoryToken(NotificationDelivery), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Device), useValue: mockDeviceRepo },
        { provide: EmailService, useValue: { sendEmail: jest.fn().mockResolvedValue(true) } },
        { provide: SchedulerRegistry, useValue: { addTimeout: jest.fn(), deleteTimeout: jest.fn() } },
        { provide: 'NOTIFICATION_SERVICE', useValue: mockNotificationClient },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('emitPushEvent', () => {
    it('should emit push event when user has push enabled and event type enabled', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { push: true, achievements: true } },
      });
      mockDeviceRepo.find.mockResolvedValue([
        { token: 'token-1', platform: 'ios' },
        { token: 'token-2', platform: 'android' },
      ]);

      await service.emitPushEvent('user-1', 'achievements', {
        title: 'Achievement!',
        body: 'You did it',
      });

      expect(mockNotificationClient.emit).toHaveBeenCalledWith(
        'AchievementUnlocked',
        expect.objectContaining({
          userId: 'user-1',
          tokens: ['token-1', 'token-2'],
        }),
      );
    });

    it('should NOT emit when global push is disabled', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { push: false, achievements: true } },
      });

      await service.emitPushEvent('user-1', 'achievements', {
        title: 'Achievement!',
        body: 'You did it',
      });

      expect(mockNotificationClient.emit).not.toHaveBeenCalled();
    });

    it('should NOT emit when event type is disabled', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { push: true, achievements: false } },
      });

      await service.emitPushEvent('user-1', 'achievements', {
        title: 'Achievement!',
        body: 'You did it',
      });

      expect(mockNotificationClient.emit).not.toHaveBeenCalled();
    });

    it('should NOT emit when user has no device tokens', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { push: true } },
      });
      mockDeviceRepo.find.mockResolvedValue([]);

      await service.emitPushEvent('user-1', 'achievements', {
        title: 'Achievement!',
        body: 'You did it',
      });

      expect(mockNotificationClient.emit).not.toHaveBeenCalled();
    });

    it('should default event type to enabled when not explicitly set', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        preferences: { notifications: { push: true } },
      });
      mockDeviceRepo.find.mockResolvedValue([{ token: 'tok-1', platform: 'web' }]);

      await service.emitPushEvent('user-1', 'dailyChallenge', {
        title: 'Daily Challenge!',
        body: 'New puzzle available',
      });

      expect(mockNotificationClient.emit).toHaveBeenCalled();
    });
  });
});
