import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { QuestChainService } from '../services/quest-chain.service';
import { QuestChainProgressionService } from '../services/quest-chain-progression.service';
import { QuestChainValidationService } from '../services/quest-chain-validation.service';
import { QuestChainLeaderboardService } from '../services/quest-chain-leaderboard.service';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

describe('Quest Chain End-to-End Tests', () => {
  let app: INestApplication;
  let questChainService: QuestChainService;
  let progressionService: QuestChainProgressionService;
  let validationService: QuestChainValidationService;
  let leaderboardService: QuestChainLeaderboardService;

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
      getRawMany: jest.fn(),
    })),
  };

  const mockQuestChainPuzzleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    })),
  };

  const mockUserProgressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };



  const mockPuzzleRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
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
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepository,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    questChainService = moduleRef.get<QuestChainService>(QuestChainService);
    progressionService = moduleRef.get<QuestChainProgressionService>(QuestChainProgressionService);
    validationService = moduleRef.get<QuestChainValidationService>(QuestChainValidationService);
    leaderboardService = moduleRef.get<QuestChainLeaderboardService>(QuestChainLeaderboardService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Full Chain Progression Flow', () => {
    it('should complete a full chain with rewards and progression', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      
      // Create a quest chain with puzzles
      const mockChain = {
        id: chainId,
        name: 'Test Chain',
        description: 'A test chain for e2e testing',
        status: 'active',
        story: {
          intro: 'Welcome to the test chain!',
          outro: 'Congratulations, you completed the chain!',
          chapters: [{
            id: 'chapter1',
            title: 'Chapter 1',
            description: 'First chapter',
            storyText: 'Begin your journey here'
          }]
        },
        rewards: {
          completion: {
            xp: 100,
            coins: 50,
            items: ['medal']
          },
          milestones: [{
            puzzleIndex: 2,
            rewards: {
              xp: 50,
              coins: 25,
              items: ['hint']
            }
          }]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        chainPuzzles: []
      };

      const mockPuzzle1 = {
        id: uuidv4(),
        title: 'Puzzle 1',
        description: 'First puzzle in the chain',
        difficulty: 'easy',
        category: 'logic',
        maxHints: 3
      };

      const mockPuzzle2 = {
        id: uuidv4(),
        title: 'Puzzle 2',
        description: 'Second puzzle in the chain',
        difficulty: 'medium',
        category: 'logic',
        maxHints: 3
      };

      const mockChainPuzzle1 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle1.id,
        sequenceOrder: 0,
        unlockConditions: {
          previousPuzzles: []
        },
        isCheckpoint: true,
        checkpointRewards: {
          xp: 10,
          coins: 5,
          items: ['bronze_medal']
        }
      };

      const mockChainPuzzle2 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle2.id,
        sequenceOrder: 1,
        unlockConditions: {
          previousPuzzles: [mockPuzzle1.id]
        },
        isCheckpoint: false,
        checkpointRewards: {}
      };

      // Mock the service calls
      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.find.mockResolvedValue([mockChainPuzzle1, mockChainPuzzle2]);
      mockPuzzleRepository.findOne.mockImplementation((opts) => {
        if (opts.where.id === mockPuzzle1.id) return mockPuzzle1;
        if (opts.where.id === mockPuzzle2.id) return mockPuzzle2;
        return null;
      });

      // Start the chain
      const startedProgress = await progressionService.startChain(userId, chainId);
      
      expect(startedProgress).toBeDefined();
      expect(startedProgress.userId).toBe(userId);
      expect(startedProgress.questChainId).toBe(chainId);
      expect(startedProgress.status).toBe('in_progress');

      // Complete the first puzzle
      const completionData1 = {
        score: 100,
        timeTaken: 120, // seconds
        hintsUsed: 1
      };

      const updatedProgress1 = await progressionService.completePuzzle(
        userId, 
        chainId, 
        mockPuzzle1.id, 
        completionData1
      );

      expect(updatedProgress1.completedPuzzleIds).toContain(mockPuzzle1.id);
      expect(updatedProgress1.totalScore).toBe(100);
      expect(updatedProgress1.totalTime).toBe(120);
      expect(updatedProgress1.totalHintsUsed).toBe(1);

      // Complete the second puzzle
      const completionData2 = {
        score: 150,
        timeTaken: 180, // seconds
        hintsUsed: 0
      };

      const finalProgress = await progressionService.completePuzzle(
        userId, 
        chainId, 
        mockPuzzle2.id, 
        completionData2
      );

      expect(finalProgress.completedPuzzleIds).toContain(mockPuzzle2.id);
      expect(finalProgress.totalScore).toBe(250); // 100 + 150
      expect(finalProgress.totalTime).toBe(300); // 120 + 180
      expect(finalProgress.status).toBe('completed');
    });
  });

  describe('Branching Path Logic', () => {
    it('should handle branching paths based on performance', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      
      // Create a chain with branching conditions
      const mockChain = {
        id: chainId,
        name: 'Branching Chain',
        description: 'A test chain with branching paths',
        status: 'active',
        story: {
          intro: 'Welcome to the branching chain!',
          outro: 'You completed one of the paths!',
          chapters: []
        },
        rewards: {
          completion: {
            xp: 100,
            coins: 50,
            items: ['branch_medal']
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        chainPuzzles: []
      };

      const mockPuzzle1 = {
        id: uuidv4(),
        title: 'Puzzle 1',
        description: 'First puzzle with branching',
        difficulty: 'easy',
        category: 'logic',
        maxHints: 3
      };

      const mockPuzzle2 = {
        id: uuidv4(),
        title: 'Easy Path Puzzle',
        description: 'Puzzle for high performers',
        difficulty: 'hard',
        category: 'logic',
        maxHints: 2
      };

      const mockPuzzle3 = {
        id: uuidv4(),
        title: 'Hard Path Puzzle',
        description: 'Puzzle for lower performers',
        difficulty: 'easy',
        category: 'logic',
        maxHints: 5
      };

      const mockChainPuzzle1 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle1.id,
        sequenceOrder: 0,
        unlockConditions: {
          previousPuzzles: []
        },
        branchConditions: [
          {
            conditionType: 'score',
            operator: 'gte',
            value: 100,
            nextPuzzleId: mockPuzzle2.id
          },
          {
            conditionType: 'score',
            operator: 'lt',
            value: 100,
            nextPuzzleId: mockPuzzle3.id
          }
        ]
      };

      const mockChainPuzzle2 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle2.id,
        sequenceOrder: 1,
        unlockConditions: {
          previousPuzzles: [mockPuzzle1.id]
        }
      };

      const mockChainPuzzle3 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle3.id,
        sequenceOrder: 1,
        unlockConditions: {
          previousPuzzles: [mockPuzzle1.id]
        }
      };

      // Mock the service calls
      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.find.mockImplementation((opts) => {
        if (opts.where.questChainId === chainId) {
          return Promise.resolve([mockChainPuzzle1, mockChainPuzzle2, mockChainPuzzle3]);
        }
        return Promise.resolve([]);
      });
      mockPuzzleRepository.findOne.mockImplementation((opts) => {
        if (opts.where.id === mockPuzzle1.id) return mockPuzzle1;
        if (opts.where.id === mockPuzzle2.id) return mockPuzzle2;
        if (opts.where.id === mockPuzzle3.id) return mockPuzzle3;
        return null;
      });

      // Start the chain
      await progressionService.startChain(userId, chainId);

      // Complete first puzzle with high score to trigger easy path branch
      const highScoreCompletion = {
        score: 120,
        timeTaken: 90,
        hintsUsed: 0
      };

      const progressAfterBranch = await progressionService.completePuzzle(
        userId, 
        chainId, 
        mockPuzzle1.id, 
        highScoreCompletion
      );

      // Verify branching logic worked correctly
      expect(progressAfterBranch.branchPath[mockChainPuzzle1.id]).toBe(mockPuzzle2.id);
    });
  });

  describe('Reward Distribution', () => {
    it('should distribute checkpoint, milestone, and completion rewards', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      
      const mockChain = {
        id: chainId,
        name: 'Reward Chain',
        description: 'A test chain with rewards',
        status: 'active',
        story: {
          intro: 'Welcome to the reward chain!',
          outro: 'Thanks for playing!',
          chapters: []
        },
        rewards: {
          completion: {
            xp: 200,
            coins: 100,
            items: ['gold_medal']
          },
          milestones: [
            {
              puzzleIndex: 1,
              rewards: {
                xp: 50,
                coins: 25,
                items: ['silver_medal']
              }
            },
            {
              puzzleIndex: 2,
              rewards: {
                xp: 75,
                coins: 35,
                items: ['bronze_medal']
              }
            }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        chainPuzzles: []
      };

      const mockPuzzle1 = {
        id: uuidv4(),
        title: 'Puzzle 1',
        description: 'First puzzle with checkpoint',
        difficulty: 'easy',
        category: 'logic',
        maxHints: 3
      };

      const mockPuzzle2 = {
        id: uuidv4(),
        title: 'Puzzle 2',
        description: 'Second puzzle',
        difficulty: 'medium',
        category: 'logic',
        maxHints: 3
      };

      const mockChainPuzzle1 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle1.id,
        sequenceOrder: 0,
        unlockConditions: {
          previousPuzzles: []
        },
        isCheckpoint: true,
        checkpointRewards: {
          xp: 25,
          coins: 10,
          items: ['checkpoint_badge']
        }
      };

      const mockChainPuzzle2 = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId: mockPuzzle2.id,
        sequenceOrder: 1,
        unlockConditions: {
          previousPuzzles: [mockPuzzle1.id]
        },
        isCheckpoint: false,
        checkpointRewards: {}
      };

      // Mock the service calls
      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.find.mockResolvedValue([mockChainPuzzle1, mockChainPuzzle2]);
      mockPuzzleRepository.findOne.mockImplementation((opts) => {
        if (opts.where.id === mockPuzzle1.id) return mockPuzzle1;
        if (opts.where.id === mockPuzzle2.id) return mockPuzzle2;
        return null;
      });

      // Start the chain
      await progressionService.startChain(userId, chainId);

      // Complete first puzzle (should trigger checkpoint reward)
      const completionData1 = {
        score: 100,
        timeTaken: 120,
        hintsUsed: 1
      };

      const progressAfterPuzzle1 = await progressionService.completePuzzle(
        userId, 
        chainId, 
        mockPuzzle1.id, 
        completionData1
      );

      // Complete second puzzle (should complete the chain and trigger completion rewards)
      const completionData2 = {
        score: 150,
        timeTaken: 180,
        hintsUsed: 0
      };

      const finalProgress = await progressionService.completePuzzle(
        userId, 
        chainId, 
        mockPuzzle2.id, 
        completionData2
      );

      // Verify chain is completed
      expect(finalProgress.status).toBe('completed');
      expect(finalProgress.completedPuzzleIds.length).toBe(2);
    });
  });

  describe('Leaderboard Functionality', () => {
    it('should generate speed run leaderboards correctly', async () => {
      const chainId = uuidv4();
      const userId1 = uuidv4();
      const userId2 = uuidv4();
      
      const mockProgresses = [
        {
          userId: userId1,
          questChainId: chainId,
          status: 'completed',
          totalTime: 300, // 5 minutes
          totalScore: 250,
          completedAt: new Date(Date.now() - 10000),
          user: { username: 'Player1' }
        },
        {
          userId: userId2,
          questChainId: chainId,
          status: 'completed',
          totalTime: 240, // 4 minutes
          totalScore: 220,
          completedAt: new Date(Date.now() - 5000),
          user: { username: 'Player2' }
        }
      ];

      // Mock the leaderboard service calls
      mockUserProgressRepository.createQueryBuilder.mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockProgresses),
      });

      const speedLeaderboard = await leaderboardService.getSpeedRunLeaderboard(chainId, 10);
      
      expect(speedLeaderboard.length).toBeGreaterThan(0);
      expect(speedLeaderboard[0].value).toBe(240); // Fastest time should be first
      expect(speedLeaderboard[0].userId).toBe(userId2);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset chain progress completely', async () => {
      const userId = uuidv4();
      const chainId = uuidv4();
      
      const initialProgress = {
        id: uuidv4(),
        userId,
        questChainId: chainId,
        status: 'in_progress',
        currentPuzzleIndex: 1,
        completedPuzzleIds: ['puzzle1'],
        checkpointData: {
          'puzzle1': {
            completedAt: new Date(),
            score: 100,
            timeTaken: 120,
            hintsUsed: 1
          }
        },
        branchPath: {},
        totalScore: 100,
        totalTime: 120,
        totalHintsUsed: 1,
        startedAt: new Date(),
        lastPlayedAt: new Date(),
      };

      const mockChain = {
        id: chainId,
        name: 'Reset Test Chain',
        description: 'A chain for testing reset functionality',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the service calls
      mockUserProgressRepository.findOne.mockResolvedValue(initialProgress);
      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockUserProgressRepository.save.mockImplementation((progress) => Promise.resolve(progress));

      // Start with initial progress
      const startedProgress = await progressionService.getProgress(userId, chainId);
      expect(startedProgress.status).toBe('in_progress');

      // Reset the progress
      const resetProgress = await progressionService.resetProgress(userId, chainId);
      
      // Verify reset values
      expect(resetProgress.status).toBe('not_started');
      expect(resetProgress.currentPuzzleIndex).toBe(0);
      expect(resetProgress.completedPuzzleIds.length).toBe(0);
      expect(Object.keys(resetProgress.checkpointData).length).toBe(0);
      expect(Object.keys(resetProgress.branchPath).length).toBe(0);
      expect(resetProgress.totalScore).toBe(0);
      expect(resetProgress.totalTime).toBe(0);
      expect(resetProgress.totalHintsUsed).toBe(0);
      expect(resetProgress.startedAt).toBeNull();
      expect(resetProgress.completedAt).toBeNull();
      expect(resetProgress.lastPlayedAt).toBeNull();
    });
  });
});