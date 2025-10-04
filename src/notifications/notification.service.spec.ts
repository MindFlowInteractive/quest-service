import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { Device } from './entities/device.entity';
import { User } from '../users/entities/user.entity';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockRepo = () => ({ create: jest.fn((d) => d), save: jest.fn((d) => Promise.resolve({ ...d, id: 'id' })), findOne: jest.fn(), find: jest.fn(), delete: jest.fn() });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(Notification), useFactory: mockRepo },
        { provide: getRepositoryToken(NotificationDelivery), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Device), useFactory: mockRepo },
        { provide: 'EmailService', useValue: { sendEmail: jest.fn().mockResolvedValue(true) } },
        { provide: 'PushService', useValue: { sendToToken: jest.fn().mockResolvedValue({ queued: true }) } },
        { provide: 'SchedulerRegistry', useValue: { addTimeout: jest.fn(), deleteTimeout: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
