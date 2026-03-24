import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AchievementService } from './achievement.service';
import { Achievement } from './entities/achievement.entity';
import { AchievementProgress } from './entities/achievement-progress.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { AchievementHistory } from './entities/achievement-history.entity';
import { AchievementNotificationService } from './achievement-notification.service';

function createRepositoryMock() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => value),
  };
}

describe('AchievementService', () => {
  let service: AchievementService;

  const achievementRepo = createRepositoryMock();
  const progressRepo = createRepositoryMock();
  const badgeRepo = createRepositoryMock();
  const userBadgeRepo = createRepositoryMock();
  const historyRepo = createRepositoryMock();

  const notificationService = {
    sendUnlockNotification: jest.fn().mockResolvedValue({
      delivered: true,
      channel: 'log',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementService,
        {
          provide: getRepositoryToken(Achievement),
          useValue: achievementRepo,
        },
        {
          provide: getRepositoryToken(AchievementProgress),
          useValue: progressRepo,
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: badgeRepo,
        },
        {
          provide: getRepositoryToken(UserBadge),
          useValue: userBadgeRepo,
        },
        {
          provide: getRepositoryToken(AchievementHistory),
          useValue: historyRepo,
        },
        {
          provide: AchievementNotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
  });

  it('should unlock achievement, award badge, and send notification', async () => {
    const achievement = {
      id: 'a-1',
      code: 'FIRST_WIN',
      name: 'First Win',
      targetValue: 1,
      rarity: 'COMMON',
      badge: {
        id: 'b-1',
        name: 'Winner Badge',
      },
    };

    achievementRepo.find.mockResolvedValue([achievement]);
    progressRepo.findOne.mockResolvedValue(null);
    userBadgeRepo.findOne.mockResolvedValue(null);

    const result = await service.trackProgress({
      userId: 'user-1',
      metricKey: 'wins',
      amount: 1,
    });

    expect(result.unlocked).toHaveLength(1);
    expect(result.badgesAwarded).toHaveLength(1);
    expect(notificationService.sendUnlockNotification).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalled();
  });

  it('should not unlock when progress is below threshold', async () => {
    const achievement = {
      id: 'a-2',
      code: 'TEN_WINS',
      name: 'Ten Wins',
      targetValue: 10,
      rarity: 'RARE',
      badge: null,
    };

    achievementRepo.find.mockResolvedValue([achievement]);
    progressRepo.findOne.mockResolvedValue({
      id: 'p-1',
      userId: 'user-1',
      achievementId: 'a-2',
      currentValue: 5,
      unlockedAt: null,
    });

    const result = await service.trackProgress({
      userId: 'user-1',
      metricKey: 'wins',
      amount: 2,
    });

    expect(result.unlocked).toHaveLength(0);
    expect(result.badgesAwarded).toHaveLength(0);
    expect(notificationService.sendUnlockNotification).not.toHaveBeenCalled();
  });
});
