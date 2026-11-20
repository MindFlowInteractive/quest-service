import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QuestChainProgressionService } from '../services/quest-chain-progression.service';
import { UserQuestChainProgress } from '../entities/user-quest-chain-progress.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { QuestChain } from '../entities/quest-chain.entity';
import { PuzzleCompletionDto } from '../dto/puzzle-completion.dto';

describe('QuestChainProgressionService', () => {
  let service: QuestChainProgressionService;
  let userProgressRepository: Repository<UserQuestChainProgress>;
  let questChainPuzzleRepository: Repository<QuestChainPuzzle>;

  const mockUserProgressRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockQuestChainPuzzleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockQuestChainRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestChainProgressionService,
        {
          provide: getRepositoryToken(UserQuestChainProgress),
          useValue: mockUserProgressRepository,
        },
        {
          provide: getRepositoryToken(QuestChainPuzzle),
          useValue: mockQuestChainPuzzleRepository,
        },
        {
          provide: getRepositoryToken(QuestChain),
          useValue: mockQuestChainRepository,
        },
      ],
    }).compile();

    service = module.get<QuestChainProgressionService>(
      QuestChainProgressionService,
    );
    userProgressRepository = module.get<Repository<UserQuestChainProgress>>(
      getRepositoryToken(UserQuestChainProgress),
    );
    questChainPuzzleRepository = module.get<Repository<QuestChainPuzzle>>(
      getRepositoryToken(QuestChainPuzzle),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startChain', () => {
    it('should start a new quest chain for a user', async () => {
      const userId = 'user123';
      const chainId = 'chain456';

      const mockProgress = {
        id: 'progress789',
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
        startedAt: expect.any(Date),
        lastPlayedAt: expect.any(Date),
      };

      mockUserProgressRepository.findOne.mockResolvedValue(null);
      mockUserProgressRepository.create.mockReturnValue(mockProgress);
      mockUserProgressRepository.save.mockResolvedValue(mockProgress);

      const result = await service.startChain(userId, chainId);

      expect(result).toEqual(mockProgress);
      expect(userProgressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          questChainId: chainId,
          status: 'in_progress',
          currentPuzzleIndex: 0,
          startedAt: expect.any(Date),
          lastPlayedAt: expect.any(Date),
        }),
      );
    });

    it('should return existing progress if chain already started', async () => {
      const userId = 'user123';
      const chainId = 'chain456';

      const existingProgress = {
        id: 'progress789',
        userId,
        questChainId: chainId,
        status: 'in_progress',
        currentPuzzleIndex: 1,
        completedPuzzleIds: ['puzzle1'],
      };

      mockUserProgressRepository.findOne.mockResolvedValue(existingProgress);

      const result = await service.startChain(userId, chainId);

      expect(result).toEqual(existingProgress);
      expect(userProgressRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('checkUnlockConditions', () => {
    it('should return true when no unlock conditions are set', () => {
      const chainPuzzle = {
        unlockConditions: null,
      } as any;

      const userProgress = {} as any;

      const result = service.checkUnlockConditions(chainPuzzle, userProgress);
      expect(result).toBe(true);
    });

    it('should return false when previous puzzles are not completed', () => {
      const chainPuzzle = {
        unlockConditions: {
          previousPuzzles: ['puzzle1', 'puzzle2'],
        },
      } as any;

      const userProgress = {
        completedPuzzleIds: ['puzzle1'], // missing puzzle2
      } as any;

      const result = service.checkUnlockConditions(chainPuzzle, userProgress);
      expect(result).toBe(false);
    });

    it('should return true when all unlock conditions are met', () => {
      const chainPuzzle = {
        unlockConditions: {
          previousPuzzles: ['puzzle1', 'puzzle2'],
          minimumScore: 100,
          timeLimit: 300,
        },
      } as any;

      const userProgress = {
        completedPuzzleIds: ['puzzle1', 'puzzle2'],
        totalScore: 150,
        totalTime: 200,
      } as any;

      const result = service.checkUnlockConditions(chainPuzzle, userProgress);
      expect(result).toBe(true);
    });
  });

  describe('evaluateBranchConditions', () => {
    it('should return null when no branch conditions exist', () => {
      const chainPuzzle = {
        branchConditions: [],
      } as any;

      const completionData = {
        score: 100,
        timeTaken: 120,
        hintsUsed: 1,
      } as PuzzleCompletionDto;

      const result = service.evaluateBranchConditions(
        chainPuzzle,
        completionData,
      );
      expect(result).toBeNull();
    });

    it('should return next puzzle ID when branch condition is met', () => {
      const chainPuzzle = {
        branchConditions: [
          {
            conditionType: 'score',
            operator: 'gte',
            value: 80,
            nextPuzzleId: 'puzzle5',
          },
        ],
      } as any;

      const completionData = {
        score: 90, // meets condition >= 80
        timeTaken: 120,
        hintsUsed: 1,
      } as PuzzleCompletionDto;

      const result = service.evaluateBranchConditions(
        chainPuzzle,
        completionData,
      );
      expect(result).toBe('puzzle5');
    });

    describe('chapter and stage progression', () => {
      const firstChapter = {
        id: 'chapter-one',
        title: 'Chapter One',
        description: 'First chapter',
        storyText: 'The story begins.',
      };
      const secondChapter = {
        id: 'chapter-two',
        title: 'Chapter Two',
        description: 'Second chapter',
        storyText: 'The story continues.',
      };

      it('serves required stage narrative before an available optional stage', async () => {
        const progress = {
          completedPuzzleIds: [],
          totalScore: 0,
          totalTime: 0,
          totalHintsUsed: 0,
        };
        const optionalStage = {
          puzzleId: 'side-stage',
          chapterId: firstChapter.id,
          sequenceOrder: 0,
          isOptional: true,
          unlockConditions: {},
          puzzle: { id: 'side-stage' },
        };
        const requiredStage = {
          puzzleId: 'main-stage',
          chapterId: firstChapter.id,
          sequenceOrder: 1,
          isOptional: false,
          narrative: 'A new clue appears.',
          unlockConditions: {},
          puzzle: { id: 'main-stage' },
        };

        mockUserProgressRepository.findOne.mockResolvedValue(progress);
        mockQuestChainRepository.findOne.mockResolvedValue({
          story: { chapters: [firstChapter, secondChapter] },
        });
        mockQuestChainPuzzleRepository.find.mockResolvedValue([
          optionalStage,
          requiredStage,
        ]);

        const next = await service.getNextPuzzle('user', 'chain');

        expect(next).toEqual({
          puzzle: requiredStage.puzzle,
          chainPuzzle: requiredStage,
          narrative: 'A new clue appears.',
        });
      });

      it('unlocks the next chapter when required stages are complete, even if a side stage is not', async () => {
        const progress = {
          status: 'in_progress',
          completedPuzzleIds: ['first-stage'],
          totalScore: 10,
          totalTime: 20,
          totalHintsUsed: 0,
        };
        const stages = [
          {
            puzzleId: 'first-stage',
            chapterId: firstChapter.id,
            sequenceOrder: 0,
            isOptional: false,
            unlockConditions: {},
          },
          {
            puzzleId: 'side-stage',
            chapterId: firstChapter.id,
            sequenceOrder: 1,
            isOptional: true,
            narrative: 'A hidden passage.',
            unlockConditions: {},
          },
          {
            puzzleId: 'next-chapter-stage',
            chapterId: secondChapter.id,
            sequenceOrder: 2,
            isOptional: false,
            unlockConditions: { previousPuzzles: ['side-stage'] },
          },
        ];

        mockQuestChainRepository.findOne.mockResolvedValue({
          id: 'chain',
          story: { chapters: [firstChapter, secondChapter] },
        });
        mockUserProgressRepository.findOne.mockResolvedValue(progress);
        mockQuestChainPuzzleRepository.find.mockResolvedValue(stages);

        const campaign = await service.getCampaignProgress('user', 'chain');

        expect(campaign.completedChapterIds).toEqual([firstChapter.id]);
        expect(campaign.currentChapterId).toBe(secondChapter.id);
        expect(campaign.chapters[0].stages[1]).toMatchObject({
          puzzleId: 'side-stage',
          isOptional: true,
          completed: false,
          unlocked: true,
          narrative: 'A hidden passage.',
        });
        expect(campaign.chapters[1].unlocked).toBe(true);
      });

      it('keeps later chapters locked until every required stage in prior chapters is complete', async () => {
        const progress = {
          status: 'in_progress',
          completedPuzzleIds: [],
          totalScore: 0,
          totalTime: 0,
          totalHintsUsed: 0,
        };
        const stages = [
          {
            puzzleId: 'first-stage',
            chapterId: firstChapter.id,
            sequenceOrder: 0,
            isOptional: false,
            unlockConditions: {},
          },
          {
            puzzleId: 'next-chapter-stage',
            chapterId: secondChapter.id,
            sequenceOrder: 1,
            isOptional: false,
            unlockConditions: {},
          },
        ];

        mockQuestChainRepository.findOne.mockResolvedValue({
          id: 'chain',
          story: { chapters: [firstChapter, secondChapter] },
        });
        mockUserProgressRepository.findOne.mockResolvedValue(progress);
        mockQuestChainPuzzleRepository.find.mockResolvedValue(stages);

        const campaign = await service.getCampaignProgress('user', 'chain');

        expect(campaign.chapters[0].unlocked).toBe(true);
        expect(campaign.chapters[1].unlocked).toBe(false);
        expect(campaign.chapters[1].stages[0].unlocked).toBe(false);
      });
    });
  });
});
