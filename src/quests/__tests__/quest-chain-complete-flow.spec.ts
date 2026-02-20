import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { QuestChainService } from '../services/quest-chain.service';
import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { CreateQuestChainDto } from '../dto/create-quest-chain.dto';
import { QuestChainProgressionService } from '../services/quest-chain-progression.service';
import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { PuzzleCompletionDto } from '../dto/puzzle-completion.dto';
import { QuestChainValidationService } from '../services/quest-chain-validation.service';
import { QuestChainLeaderboardService } from '../services/quest-chain-leaderboard.service';

describe('QuestChain Complete Integration Tests', () => {
  let questChainService: QuestChainService;
  let progressionService: QuestChainProgressionService;
  let validationService: QuestChainValidationService;
  let leaderboardService: QuestChainLeaderboardService;
  
  let questChainRepository: Repository<QuestChain>;
  let questChainPuzzleRepository: Repository<QuestChainPuzzle>;
  let userProgressRepository: Repository<UserQuestChainProgress>;

  const mockQuestChainRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
    remove: jest.fn(),
  };

  const mockQuestChainPuzzleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserProgressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  const mockUserRepository = {
    findByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestChainService,
        QuestChainProgressionService,
        QuestChainValidationService,
        QuestChainLeaderboardService,
        {
          provide: getRepositoryToken(QuestChain),
          useValue: mockQuestChainRepository,
        },
        {
          provide: getRepositoryToken(QuestChainPuzzle),
          useValue: mockQuestChainPuzzleRepository,
        },
        {
          provide: getRepositoryToken(UserQuestChainProgress),
          useValue: mockUserProgressRepository,
        },
        {
          provide: 'UserRepository', // This would normally be getRepositoryToken(User)
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    questChainService = module.get<QuestChainService>(QuestChainService);
    progressionService = module.get<QuestChainProgressionService>(QuestChainProgressionService);
    validationService = module.get<QuestChainValidationService>(QuestChainValidationService);
    leaderboardService = module.get<QuestChainLeaderboardService>(QuestChainLeaderboardService);
    
    questChainRepository = module.get<Repository<QuestChain>>(getRepositoryToken(QuestChain));
    questChainPuzzleRepository = module.get<Repository<QuestChainPuzzle>>(getRepositoryToken(QuestChainPuzzle));
    userProgressRepository = module.get<Repository<UserQuestChainProgress>>(getRepositoryToken(UserQuestChainProgress));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Quest Chain Flow', () => {
    it('should complete a full quest chain with rewards and leaderboard', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      const puzzle1Id = uuidv4();
      const puzzle2Id = uuidv4();
      
      // Create a quest chain with rewards
      const createDto: CreateQuestChainDto = {
        name: 'Test Chain with Rewards',
        description: 'A chain to test rewards',
        story: {
          intro: 'Start of the adventure',
          outro: 'End of the adventure',
          chapters: [
            {
              id: 'chapter1',
              title: 'Chapter 1',
              description: 'First chapter',
              storyText: 'This is the first chapter',
            }
          ],
        },
        rewards: {
          completion: {
            xp: 500,
            coins: 250,
            items: ['completion-badge'],
          },
          milestones: [
            {
              puzzleIndex: 1,
              rewards: {
                xp: 100,
                coins: 50,
                items: ['milestone-badge'],
              },
            }
          ],
        },
      };

      const mockChain = {
        id: chainId,
        ...createDto,
        status: 'active',
        completionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuestChainRepository.create.mockReturnValue(mockChain);
      mockQuestChainRepository.save.mockResolvedValue(mockChain);

      // Create the chain
      const createdChain = await questChainService.createChain(createDto);
      expect(createdChain).toEqual(mockChain);

      // Add puzzles to the chain
      const chainPuzzle1 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: puzzle1Id,
        sequenceOrder: 0,
        unlockConditions: { previousPuzzles: [] },
        isCheckpoint: true,
        checkpointRewards: {
          xp: 50,
          coins: 25,
          items: ['checkpoint-item'],
        },
      };

      const chainPuzzle2 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: puzzle2Id,
        sequenceOrder: 1,
        unlockConditions: { previousPuzzles: [puzzle1Id] },
        isCheckpoint: false,
      };

      mockQuestChainPuzzleRepository.create
        .mockReturnValueOnce(chainPuzzle1)
        .mockReturnValueOnce(chainPuzzle2);
      mockQuestChainPuzzleRepository.save
        .mockResolvedValueOnce(chainPuzzle1)
        .mockResolvedValueOnce(chainPuzzle2);
      mockQuestChainPuzzleRepository.findOne
        .mockResolvedValueOnce(chainPuzzle1)
        .mockResolvedValueOnce(chainPuzzle2);
      mockQuestChainPuzzleRepository.find
        .mockResolvedValue([chainPuzzle1, chainPuzzle2]);

      // Start the chain for a user
      const initialProgress = {
        id: uuidv4(),
        userId,
        questChainId: chainId,
        status: 'in_progress',
        currentPuzzleIndex: 0,
        completedPuzzleIds: [],
        checkpointData: {},
        branchPath: {},
        totalScore: 0,
        totalTime: 0,
        totalHintsUsed: 0,
        startedAt: new Date(),
        lastPlayedAt: new Date(),
      };

      mockUserProgressRepository.create.mockReturnValue(initialProgress);
      mockUserProgressRepository.save.mockResolvedValue(initialProgress);
      mockUserProgressRepository.findOne.mockResolvedValue(initialProgress);

      const startedProgress = await progressionService.startChain(userId, chainId);
      expect(startedProgress.status).toBe('in_progress');

      // Complete first puzzle with checkpoint rewards
      const completionData1: PuzzleCompletionDto = {
        score: 100,
        timeTaken: 120, // 2 minutes
        hintsUsed: 1,
        completedSuccessfully: true,
      };

      const updatedProgress1 = {
        ...initialProgress,
        completedPuzzleIds: [puzzle1Id],
        currentPuzzleIndex: 0,
        totalScore: 100,
        totalTime: 120,
        totalHintsUsed: 1,
        checkpointData: {
          [puzzle1Id]: {
            completedAt: new Date(),
            score: 100,
            timeTaken: 120,
            hintsUsed: 1,
          },
        },
        lastPlayedAt: new Date(),
      };

      mockUserProgressRepository.save.mockResolvedValueOnce(updatedProgress1);

      const progressAfterPuzzle1 = await progressionService.completePuzzle(
        userId,
        chainId,
        puzzle1Id,
        completionData1
      );

      expect(progressAfterPuzzle1.completedPuzzleIds).toContain(puzzle1Id);
      expect(progressAfterPuzzle1.totalScore).toBe(100);

      // Complete second puzzle and finish the chain
      const completionData2: PuzzleCompletionDto = {
        score: 150,
        timeTaken: 180, // 3 minutes
        hintsUsed: 0,
        completedSuccessfully: true,
      };

      const completedProgress = {
        ...updatedProgress1,
        completedPuzzleIds: [puzzle1Id, puzzle2Id],
        currentPuzzleIndex: 1,
        status: 'completed',
        totalScore: 250, // 100 + 150
        totalTime: 300, // 120 + 180
        totalHintsUsed: 1, // 1 + 0
        completedAt: new Date(),
        lastPlayedAt: new Date(),
      };

      mockUserProgressRepository.save.mockResolvedValueOnce(completedProgress);

      const finalProgress = await progressionService.completePuzzle(
        userId,
        chainId,
        puzzle2Id,
        completionData2
      );

      expect(finalProgress.status).toBe('completed');
      expect(finalProgress.completedPuzzleIds).toHaveLength(2);

      // Verify completion count was incremented
      expect(mockQuestChainRepository.createQueryBuilder).toHaveBeenCalled();

      // Test leaderboard functionality
      const mockProgressRecords = [
        {
          userId: uuidv4(),
          totalTime: 300,
          completedAt: new Date(),
          totalScore: 250,
          totalHintsUsed: 1,
        },
        {
          userId: userId,
          totalTime: 300,
          completedAt: new Date(),
          totalScore: 250,
          totalHintsUsed: 1,
        }
      ];

      mockUserProgressRepository.createQueryBuilder().getMany.mockResolvedValue(mockProgressRecords);
      mockUserRepository.findByIds.mockResolvedValue([]);

      const leaderboard = await leaderboardService.getSpeedRunLeaderboard(chainId, 10);
      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBeTruthy();
    });

    it('should handle branching paths correctly', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      const puzzleId = uuidv4();
      
      // Create a puzzle with branch conditions
      const chainPuzzle = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId,
        sequenceOrder: 0,
        unlockConditions: { previousPuzzles: [] },
        branchConditions: [
          {
            conditionType: 'score',
            operator: 'gte',
            value: 100,
            nextPuzzleId: 'high-score-path-puzzle',
          },
          {
            conditionType: 'score',
            operator: 'lt',
            value: 100,
            nextPuzzleId: 'low-score-path-puzzle',
          },
        ],
        isCheckpoint: false,
        checkpointRewards: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        puzzle: {} as any,
        questChain: {} as any,
      };

      const mockProgress = {
        id: uuidv4(),
        userId,
        questChainId: chainId,
        status: 'in_progress',
        currentPuzzleIndex: 0,
        completedPuzzleIds: [],
        checkpointData: {},
        branchPath: {},
        totalScore: 0,
        totalTime: 0,
        totalHintsUsed: 0,
      };

      mockQuestChainPuzzleRepository.findOne.mockResolvedValue(chainPuzzle);
      mockUserProgressRepository.findOne.mockResolvedValue(mockProgress);

      // Test high score branch
      const highScoreCompletion: PuzzleCompletionDto = {
        score: 120,
        timeTaken: 120,
        hintsUsed: 0,
        completedSuccessfully: true,
      };

      const result = progressionService['evaluateBranchConditions'](chainPuzzle, highScoreCompletion);
      expect(result).toBe('high-score-path-puzzle');

      // Test low score branch
      const lowScoreCompletion: PuzzleCompletionDto = {
        score: 80,
        timeTaken: 180,
        hintsUsed: 2,
        completedSuccessfully: true,
      };

      const result2 = progressionService['evaluateBranchConditions'](chainPuzzle, lowScoreCompletion);
      expect(result2).toBe('low-score-path-puzzle');
    });

    it('should validate chain structure properly', async () => {
      const chainId = uuidv4();
      const mockChain = {
        id: chainId,
        name: 'Test Chain',
        story: {
          intro: 'intro',
          outro: 'outro',
          chapters: [],
        },
        rewards: {
          completion: {
            xp: 100,
            coins: 50,
            items: [],
          },
        },
      };

      const mockChainPuzzles = [
        { puzzleId: 'puzzle1', sequenceOrder: 0, unlockConditions: {} },
        { puzzleId: 'puzzle2', sequenceOrder: 1, unlockConditions: {} },
        { puzzleId: 'puzzle3', sequenceOrder: 2, unlockConditions: {} },
      ];

      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.find.mockResolvedValue(mockChainPuzzles);

      const validationResult = await validationService.validateChainStructure(chainId);

      expect(validationResult.isValid).toBe(true);
      expect(Array.isArray(validationResult.warnings)).toBe(true);
      expect(Array.isArray(validationResult.errors)).toBe(true);
    });
  });
});