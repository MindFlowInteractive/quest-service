import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PuzzlesController } from './puzzles.controller';
import { PuzzlesService } from './puzzles.service';
import {
  CreatePuzzleDto,
  UpdatePuzzleDto,
  SearchPuzzleDto,
  BulkUpdateDto,
  PuzzleDifficulty,
  PuzzleContentType,
  BulkAction,
  SortBy,
  SortOrder,
} from './dto';

describe('PuzzlesController', () => {
  let controller: PuzzlesController;
  let service: PuzzlesService;

  const mockPuzzlesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    bulkUpdate: jest.fn(),
    search: jest.fn(),
    getAnalytics: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
    duplicate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzlesController],
      providers: [
        {
          provide: PuzzlesService,
          useValue: mockPuzzlesService,
        },
      ],
    }).compile();

    controller = module.get<PuzzlesController>(PuzzlesController);
    service = module.get<PuzzlesService>(PuzzlesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a puzzle', async () => {
      const createPuzzleDto: CreatePuzzleDto = {
        title: 'Test Puzzle',
        description: 'A test puzzle for testing',
        category: 'logic',
        difficulty: PuzzleDifficulty.EASY,
        content: {
          type: PuzzleContentType.MULTIPLE_CHOICE,
          question: 'What is the answer to this test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
        },
        difficultyRating: 3,
        basePoints: 100,
        timeLimit: 300,
        maxHints: 3,
        tags: ['test'],
      };

      const expectedResult = {
        id: 'puzzle-123',
        ...createPuzzleDto,
        createdBy: 'temp-user-id',
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createPuzzleDto);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.create).toHaveBeenCalledWith(
        createPuzzleDto,
        'temp-user-id',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single puzzle', async () => {
      const puzzleId = 'puzzle-123';
      const expectedResult = {
        id: puzzleId,
        title: 'Test Puzzle',
        description: 'A test puzzle',
        category: 'logic',
        difficulty: PuzzleDifficulty.EASY,
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(puzzleId);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.findOne).toHaveBeenCalledWith(
        puzzleId,
        'temp-user-id',
      );
    });
  });

  describe('update', () => {
    it('should update a puzzle', async () => {
      const puzzleId = 'puzzle-123';
      const updateDto: UpdatePuzzleDto = {
        title: 'Updated Puzzle',
        description: 'Updated description',
      };

      const expectedResult = {
        id: puzzleId,
        title: 'Updated Puzzle',
        description: 'Updated description',
        category: 'logic',
        difficulty: PuzzleDifficulty.EASY,
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(puzzleId, updateDto);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.update).toHaveBeenCalledWith(
        puzzleId,
        updateDto,
        'temp-user-id',
      );
    });
  });

  describe('remove', () => {
    it('should remove a puzzle', async () => {
      const puzzleId = 'puzzle-123';

      mockPuzzlesService.remove.mockResolvedValue(undefined);

      await controller.remove(puzzleId);

      expect(mockPuzzlesService.remove).toHaveBeenCalledWith(
        puzzleId,
        'temp-user-id',
      );
    });
  });

  describe('bulkUpdate', () => {
    it('should perform bulk update with tags action', async () => {
      const puzzleIds = ['puzzle-1', 'puzzle-2'];
      const bulkUpdateDto: BulkUpdateDto = {
        action: BulkAction.ADD_TAGS,
        value: 'new-tag,bulk-updated',
      };

      const expectedResult = {
        successful: puzzleIds,
        failed: [],
        totalProcessed: puzzleIds.length,
      };

      mockPuzzlesService.bulkUpdate.mockResolvedValue(expectedResult);

      const result = await controller.bulkUpdate(puzzleIds, bulkUpdateDto);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.bulkUpdate).toHaveBeenCalledWith(
        puzzleIds,
        bulkUpdateDto,
        'temp-user-id',
      );
    });
  });

  describe('publish', () => {
    it('should publish a puzzle', async () => {
      const puzzleId = 'puzzle-123';
      const expectedResult = {
        id: puzzleId,
        title: 'Test Puzzle',
        publishedAt: new Date(),
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.publish.mockResolvedValue(expectedResult);

      const result = await controller.publish(puzzleId);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.publish).toHaveBeenCalledWith(
        puzzleId,
        'temp-user-id',
      );
    });
  });

  describe('unpublish', () => {
    it('should unpublish a puzzle', async () => {
      const puzzleId = 'puzzle-123';
      const expectedResult = {
        id: puzzleId,
        title: 'Test Puzzle',
        publishedAt: null,
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.unpublish.mockResolvedValue(expectedResult);

      const result = await controller.unpublish(puzzleId);

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.unpublish).toHaveBeenCalledWith(
        puzzleId,
        'temp-user-id',
      );
    });
  });

  describe('duplicate', () => {
    it('should duplicate a puzzle', async () => {
      const puzzleId = 'puzzle-123';

      const duplicatedPuzzle = {
        id: 'puzzle-456',
        title: 'Original Puzzle (Copy)',
        description: 'Original description',
        category: 'logic',
        difficulty: PuzzleDifficulty.EASY,
        stats: {
          totalAttempts: 0,
          successfulAttempts: 0,
          averageTimeToSolve: 0,
          averageHintsUsed: 0,
          averageRating: 0,
        },
      };

      mockPuzzlesService.duplicate.mockResolvedValue(duplicatedPuzzle);

      const result = await controller.duplicate(puzzleId);

      expect(result).toEqual(duplicatedPuzzle);
      expect(mockPuzzlesService.duplicate).toHaveBeenCalledWith(
        puzzleId,
        'temp-user-id',
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return puzzle analytics', async () => {
      const expectedResult = {
        totalPuzzles: 10,
        puzzlesByDifficulty: {
          easy: 4,
          medium: 3,
          hard: 2,
          expert: 1,
        },
        puzzlesByCategory: {
          logic: 5,
          math: 3,
          wordplay: 2,
        },
        averageRating: 4.2,
        totalAttempts: 150,
        successRate: 0.75,
      };

      mockPuzzlesService.getAnalytics.mockResolvedValue(expectedResult);

      const result = await controller.getAnalytics();

      expect(result).toEqual(expectedResult);
      expect(mockPuzzlesService.getAnalytics).toHaveBeenCalled();
    });
  });
});
