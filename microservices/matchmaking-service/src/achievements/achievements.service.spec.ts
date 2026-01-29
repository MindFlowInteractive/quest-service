import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsService } from './achievements.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { NotificationService } from '../notifications/notification.service';
import { AchievementConditionEngine } from './achievement-condition.engine';

describe('AchievementsService', () => {
  let service: AchievementsService;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  });

  const mockNotificationService = () => ({
    notifyAchievementUnlocked: jest.fn(),
  });

  const mockConditionEngine = () => ({
    evaluate: jest.fn(),
    evaluateAllForUser: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: getRepositoryToken(Achievement), useFactory: mockRepository },
        { provide: getRepositoryToken(UserAchievement), useFactory: mockRepository },
        { provide: NotificationService, useFactory: mockNotificationService },
        { provide: AchievementConditionEngine, useFactory: mockConditionEngine },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
