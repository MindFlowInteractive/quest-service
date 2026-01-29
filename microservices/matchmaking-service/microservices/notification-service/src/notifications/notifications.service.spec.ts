import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification, NotificationChannel } from './entities/notification.entity';
import { NotificationTemplate } from '../templates/entities/template.entity';
import { UserPreference } from '../preferences/entities/preference.entity';
import { TemplateEngineService } from '../templates/template-engine.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let mockNotificationRepo;
    let mockTemplateRepo;
    let mockPreferenceRepo;
    let mockQueue;

    beforeEach(async () => {
        mockNotificationRepo = {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn().mockImplementation(notif => Promise.resolve({ id: 'uuid', ...notif })),
            find: jest.fn(),
        };
        mockTemplateRepo = {
            findOne: jest.fn(),
        };
        mockPreferenceRepo = {
            find: jest.fn().mockResolvedValue([]),
        };
        mockQueue = {
            add: jest.fn().mockResolvedValue({ id: 'job-id' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: getRepositoryToken(Notification),
                    useValue: mockNotificationRepo,
                },
                {
                    provide: getRepositoryToken(NotificationTemplate),
                    useValue: mockTemplateRepo,
                },
                {
                    provide: getRepositoryToken(UserPreference),
                    useValue: mockPreferenceRepo,
                },
                {
                    provide: TemplateEngineService,
                    useValue: { render: jest.fn().mockImplementation((t, d) => t) },
                },
                {
                    provide: getQueueToken('notifications'),
                    useValue: mockQueue,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send a notification and add it to the queue', async () => {
        const userId = 'user-1';
        const type = 'TEST_NOTIFICATION';
        const data = { message: 'Hello World' };

        const result = await service.send(userId, type, data);

        expect(result).toBeDefined();
        expect(mockNotificationRepo.save).toHaveBeenCalled();
        expect(mockQueue.add).toHaveBeenCalledWith('send-notification', expect.any(Object));
    });

    it('should use user preferences if available', async () => {
        const userId = 'user-1';
        const type = 'TEST_NOTIFICATION';
        const data = { message: 'Hello' };

        mockPreferenceRepo.find.mockResolvedValue([
            { channel: NotificationChannel.PUSH, isEnabled: true },
        ]);

        const result = await service.send(userId, type, data);

        expect(result.channels).toContain(NotificationChannel.PUSH);
        expect(result.channels).not.toContain(NotificationChannel.WEBSOCKET);
    });
});
