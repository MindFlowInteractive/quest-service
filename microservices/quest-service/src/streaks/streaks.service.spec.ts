import { Test, TestingModule } from '@nestjs/testing';
import { StreaksService } from './streaks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserStreak, StreakType } from './entities/user-streak.entity';
import { UserCombo } from './entities/user-combo.entity';
import { Repository } from 'typeorm';

describe('StreaksService', () => {
  let service: StreaksService;
  let streaksRepository: Repository<UserStreak>;
  let combosRepository: Repository<UserCombo>;

  const mockStreaksRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockCombosRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreaksService,
        {
          provide: getRepositoryToken(UserStreak),
          useValue: mockStreaksRepository,
        },
        {
          provide: getRepositoryToken(UserCombo),
          useValue: mockCombosRepository,
        },
      ],
    }).compile();

    service = module.get<StreaksService>(StreaksService);
    streaksRepository = module.get<Repository<UserStreak>>(getRepositoryToken(UserStreak));
    combosRepository = module.get<Repository<UserCombo>>(getRepositoryToken(UserCombo));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordActivity - Streaks', () => {
    it('should create a new streak if none exists', async () => {
      mockStreaksRepository.findOne.mockResolvedValue(null);
      mockStreaksRepository.create.mockImplementation((dto) => dto);
      mockStreaksRepository.save.mockImplementation((streak) => streak);
      mockCombosRepository.findOne.mockResolvedValue(null);
      mockCombosRepository.create.mockImplementation((dto) => dto);
      mockCombosRepository.save.mockImplementation((combo) => combo);

      await service.recordActivity('user1', 'PUZZLE_COMPLETE');

      expect(mockStreaksRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user1',
        streakType: StreakType.DAILY,
        currentStreak: 1,
      }));
    });

    it('should increment streak if activity is on the next day', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const existingStreak = {
        userId: 'user1',
        streakType: StreakType.DAILY,
        currentStreak: 5,
        maxStreak: 5,
        lastActivityAt: yesterday,
      };

      mockStreaksRepository.findOne.mockResolvedValue(existingStreak);
      mockStreaksRepository.save.mockImplementation((streak) => streak);
      mockCombosRepository.findOne.mockResolvedValue(null);
      mockCombosRepository.create.mockImplementation((dto) => dto);
      mockCombosRepository.save.mockImplementation((combo) => combo);

      await service.recordActivity('user1', 'PUZZLE_COMPLETE');

      expect(existingStreak.currentStreak).toBe(6);
      expect(existingStreak.maxStreak).toBe(6);
    });

    it('should reset streak if activity is missed (> 1 day)', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const existingStreak = {
        userId: 'user1',
        streakType: StreakType.DAILY,
        currentStreak: 5,
        maxStreak: 5,
        lastActivityAt: twoDaysAgo,
      };

      mockStreaksRepository.findOne.mockResolvedValue(existingStreak);
      mockStreaksRepository.save.mockImplementation((streak) => streak);
       mockCombosRepository.findOne.mockResolvedValue(null);
      mockCombosRepository.create.mockImplementation((dto) => dto);
      mockCombosRepository.save.mockImplementation((combo) => combo);

      await service.recordActivity('user1', 'PUZZLE_COMPLETE');

      expect(existingStreak.currentStreak).toBe(1);
      expect(existingStreak.maxStreak).toBe(5); // Max streak persisted
    });
  });

  describe('recordActivity - Combos', () => {
    it('should increment combo if within time limit', async () => {
        const now = new Date();
        const justNow = new Date(now.getTime() - 10000); // 10s ago

        const existingCombo = {
            userId: 'user1',
            currentMultiplier: 1.0,
            lastActionAt: justNow,
        };

        mockStreaksRepository.findOne.mockResolvedValue(null);
        mockStreaksRepository.create.mockImplementation((dto) => dto);
        mockStreaksRepository.save.mockImplementation((s) => s);
        
        mockCombosRepository.findOne.mockResolvedValue(existingCombo);
        mockCombosRepository.save.mockImplementation((c) => c);

        const result = await service.recordActivity('user1', 'PUZZLE_COMPLETE');
        
        expect(result.comboMultiplier).toBeGreaterThan(1.0);
        expect(existingCombo.currentMultiplier).toBe(1.1);
    });

    it('should reset combo if time limit exceeded', async () => {
        const now = new Date();
        const longAgo = new Date(now.getTime() - 600000); // 10 mins ago

        const existingCombo = {
            userId: 'user1',
            currentMultiplier: 2.0,
            lastActionAt: longAgo,
        };

        mockStreaksRepository.findOne.mockResolvedValue(null);
        mockStreaksRepository.create.mockImplementation((dto) => dto);
         mockStreaksRepository.save.mockImplementation((s) => s);

        mockCombosRepository.findOne.mockResolvedValue(existingCombo);
        mockCombosRepository.save.mockImplementation((c) => c);

        const result = await service.recordActivity('user1', 'PUZZLE_COMPLETE');
        
        expect(result.comboMultiplier).toBe(1.0);
    });
  });
});
