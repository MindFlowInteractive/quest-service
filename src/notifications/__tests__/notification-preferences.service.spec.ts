import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationPreferencesService', () => {
  const repository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  let service: NotificationPreferencesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        NotificationPreferencesService,
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(NotificationPreferencesService);
  });

  it('creates default preferences when none exist', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.create.mockReturnValue({ userId: 'u1' });
    repository.save.mockResolvedValue({ userId: 'u1' });

    await service.getOrCreate('u1');

    expect(repository.create).toHaveBeenCalledWith({ userId: 'u1' });
    expect(repository.save).toHaveBeenCalled();
  });

  it('respects disabled notification preference', async () => {
    repository.findOne.mockResolvedValue({
      userId: 'u1',
      questCompleted: false,
    });

    await expect(
      service.isEnabled('u1', NotificationType.QUEST_COMPLETED),
    ).resolves.toBe(false);
  });

  it('returns true for enabled notification preference', async () => {
    repository.findOne.mockResolvedValue({
      userId: 'u1',
      questCompleted: true,
    });

    await expect(
      service.isEnabled('u1', NotificationType.QUEST_COMPLETED),
    ).resolves.toBe(true);
  });
});
