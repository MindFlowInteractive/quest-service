import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PuzzlesService } from './puzzles.service';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';
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

describe('PuzzlesService', () => {
  let service: PuzzlesService;
  let puzzleRepository: Repository<Puzzle>;
  let progressRepository: Repository<PuzzleProgress>;
  let ratingRepository: Repository<PuzzleRating>;

  const mockPuzzleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockProgressRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRatingRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
    clone: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzlesService,
        {
          provide: getRepositoryToken(Puzzle),
          useValue: mockPuzzleRepository,
        },
        {
          provide: getRepositoryToken(PuzzleProgress),
          useValue: mockProgressRepository,
        },
        {
          provide: getRepositoryToken(PuzzleRating),
          useValue: mockRatingRepository,
        },
      ],
    }).compile();

    service = module.get<PuzzlesService>(PuzzlesService);
    puzzleRepository = module.get<Repository<Puzzle>>(
      getRepositoryToken(Puzzle),
    );
    progressRepository = module.get<Repository<PuzzleProgress>>(
      getRepositoryToken(PuzzleProgress),
    );
    ratingRepository = module.get<Repository<PuzzleRating>>(
      getRepositoryToken(PuzzleRating),
    );

    // Reset mocks before each test
    jest.clearAllMocks();
    mockPuzzleRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockProgressRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockRatingRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPuzzleDto: CreatePuzzleDto = {
      title: 'Test Puzzle',
      description: 'A test puzzle description that is long enough',
      category: 'logic',
      difficulty: PuzzleDifficulty.MEDIUM,
      difficultyRating: 5,
      basePoints: 100,
      timeLimit: 300,
      maxHints: 3,
      content: {
        type: PuzzleContentType.MULTIPLE_CHOICE,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Simple arithmetic',
      },
      hints: [
        {
          order: 1,
          text: 'Think about basic addition',
          pointsPenalty: 10,
          unlockAfter: 60,
        },
      ],
      tags: ['math', 'basic'],
      prerequisites: [],
      scoring: {
        timeBonus: {
          enabled: true,
          maxBonus: 50,
          baseTime: 300,
        },
      },
      isFeatured: false,
    };

    const userId = 'user-123';

    it('should create a puzzle successfully', async () => {
      const mockPuzzle = {
        id: 'puzzle-123',
        ...createPuzzleDto,
        createdBy: userId,
        publishedAt: null,
        analytics: {
          completionRate: 0,
          averageAttempts: 0,
          commonErrors: [],
          timeDistribution: {
            min: 0,
            max: 0,
            median: 0,
            q1: 0,
            q3: 0,
          },
        },
        metadata: {
          version: '1.0',
          lastModifiedBy: userId,
          reviewStatus: 'pending',
        },
      };

      mockPuzzleRepository.create.mockReturnValue(mockPuzzle);
      mockPuzzleRepository.save.mockResolvedValue(mockPuzzle);

      const result = await service.create(createPuzzleDto, userId);

      expect(mockPuzzleRepository.create).toHaveBeenCalledWith({
        ...createPuzzleDto,
        createdBy: userId,
        publishedAt: null,
        analytics: expect.objectContaining({
          completionRate: 0,
          averageAttempts: 0,
        }),
        metadata: expect.objectContaining({
          version: '1.0',
          lastModifiedBy: userId,
          reviewStatus: 'pending',
        }),
      });
      expect(mockPuzzleRepository.save).toHaveBeenCalledWith(mockPuzzle);
      expect(result).toEqual(mockPuzzle);
    });

    it('should validate prerequisites before creating', async () => {
      const dtoWithPrereqs = {
        ...createPuzzleDto,
        prerequisites: ['prereq-1', 'prereq-2'],
      };

      mockPuzzleRepository.count.mockResolvedValue(1); // Only 1 out of 2 prerequisites found

      await expect(service.create(dtoWithPrereqs, userId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPuzzleRepository.count).toHaveBeenCalledWith({
        where: { id: In(['prereq-1', 'prereq-2']) },
      });
    });

    it('should validate parent puzzle before creating', async () => {
      const dtoWithParent = {
        ...createPuzzleDto,
        parentPuzzleId: 'parent-123',
      };

      mockPuzzleRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoWithParent, userId)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockPuzzleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'parent-123' },
      });
    });
  });

  describe('findAll', () => {
    const searchDto: SearchPuzzleDto = {
      page: 1,
      limit: 20,
      sortBy: SortBy.CREATED_AT,
      sortOrder: SortOrder.DESC,
    };

    it('should return paginated puzzles with search filters', async () => {
      const mockPuzzles = [
        {
          id: 'puzzle-1',
          title: 'Math Puzzle',
          category: 'math',
          difficulty: 'medium',
        },
        {
          id: 'puzzle-2',
          title: 'Logic Puzzle',
          category: 'logic',
          difficulty: 'hard',
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPuzzles, 2]);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll(searchDto);

      expect(result).toEqual({
        puzzles: expect.arrayContaining([
          expect.objectContaining({ id: 'puzzle-1' }),
          expect.objectContaining({ id: 'puzzle-2' }),
        ]),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should apply search filters correctly', async () => {
      const searchWithFilters: SearchPuzzleDto = {
        ...searchDto,
        search: 'math',
        category: 'math',
        difficulty: PuzzleDifficulty.MEDIUM,
        minRating: 3,
        maxRating: 7,
        tags: ['algebra', 'geometry'],
        isFeatured: true,
        createdBy: 'user-123',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      await service.findAll(searchWithFilters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(puzzle.title ILIKE :search OR puzzle.description ILIKE :search OR puzzle.tags::text ILIKE :search)',
        { search: '%math%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.category = :category',
        { category: 'math' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.difficulty = :difficulty',
        { difficulty: 'medium' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.difficultyRating >= :minRating',
        { minRating: 3 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.difficultyRating <= :maxRating',
        { maxRating: 7 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.tags && ARRAY[:...tags]',
        { tags: ['algebra', 'geometry'] },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.isFeatured = :isFeatured',
        { isFeatured: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'puzzle.createdBy = :createdBy',
        { createdBy: 'user-123' },
      );
    });
  });

  describe('findOne', () => {
    const puzzleId = 'puzzle-123';
    const userId = 'user-123';

    it('should return a puzzle by id', async () => {
      const mockPuzzle = {
        id: puzzleId,
        title: 'Test Puzzle',
        publishedAt: new Date(),
        createdBy: userId,
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findOne(puzzleId, userId);

      expect(result).toEqual(expect.objectContaining({ id: puzzleId }));
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('puzzle.id = :id', {
        id: puzzleId,
      });
    });

    it('should throw NotFoundException when puzzle not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(puzzleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should restrict access to unpublished puzzles', async () => {
      const mockPuzzle = {
        id: puzzleId,
        title: 'Test Puzzle',
        publishedAt: null, // Unpublished
        createdBy: 'different-user',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);

      await expect(service.findOne(puzzleId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const puzzleId = 'puzzle-123';
    const userId = 'user-123';
    const updateDto: UpdatePuzzleDto = {
      title: 'Updated Puzzle Title',
      updateReason: 'Fixed typo in title',
    };

    it('should update a puzzle successfully', async () => {
      const mockPuzzle = {
        id: puzzleId,
        title: 'Original Title',
        createdBy: userId,
        publishedAt: new Date(),
        metadata: { version: '1.0' },
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const updatedPuzzle = { ...mockPuzzle, ...updateDto };
      mockPuzzleRepository.save.mockResolvedValue(updatedPuzzle);

      const result = await service.update(puzzleId, updateDto, userId);

      expect(mockPuzzleRepository.save).toHaveBeenCalled();
      expect(result.title).toBe(updateDto.title);
    });

    it('should prevent non-owners from updating puzzles', async () => {
      const mockPuzzle = {
        id: puzzleId,
        createdBy: 'different-user',
        publishedAt: new Date(),
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      await expect(service.update(puzzleId, updateDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    const puzzleId = 'puzzle-123';
    const userId = 'user-123';

    it('should archive puzzle when it has progress records', async () => {
      const mockPuzzle = {
        id: puzzleId,
        createdBy: userId,
        publishedAt: new Date(),
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockProgressRepository.count.mockResolvedValue(5); // Has progress records

      await service.remove(puzzleId, userId);

      expect(mockPuzzleRepository.update).toHaveBeenCalledWith(puzzleId, {
        isActive: false,
        deletedAt: expect.any(Date),
      });
      expect(mockPuzzleRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete puzzle when it has no progress records', async () => {
      const mockPuzzle = {
        id: puzzleId,
        createdBy: userId,
        publishedAt: new Date(),
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockPuzzle);
      mockProgressRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockRatingRepository.createQueryBuilder.mockReturnValue({
        ...mockQueryBuilder,
        getRawMany: jest.fn().mockResolvedValue([]),
      });
      mockProgressRepository.count.mockResolvedValue(0); // No progress records

      await service.remove(puzzleId, userId);

      expect(mockPuzzleRepository.delete).toHaveBeenCalledWith(puzzleId);
      expect(mockPuzzleRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdate', () => {
    const puzzleIds = ['puzzle-1', 'puzzle-2'];
    const userId = 'user-123';

    it('should perform bulk publish operation', async () => {
      const bulkUpdateDto: BulkUpdateDto = {
        action: BulkAction.PUBLISH,
        reason: 'Publishing approved puzzles',
      };

      const mockPuzzles = puzzleIds.map((id) => ({ id, createdBy: userId }));
      mockPuzzleRepository.find.mockResolvedValue(mockPuzzles);

      const result = await service.bulkUpdate(puzzleIds, bulkUpdateDto, userId);

      expect(result.updated).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockPuzzleRepository.update).toHaveBeenCalledTimes(2);
      expect(mockPuzzleRepository.update).toHaveBeenCalledWith('puzzle-1', {
        publishedAt: expect.any(Date),
      });
      expect(mockPuzzleRepository.update).toHaveBeenCalledWith('puzzle-2', {
        publishedAt: expect.any(Date),
      });
    });

    it('should prevent bulk update of puzzles not owned by user', async () => {
      const bulkUpdateDto: BulkUpdateDto = {
        action: BulkAction.PUBLISH,
      };

      const mockPuzzles = [
        { id: 'puzzle-1', createdBy: userId },
        { id: 'puzzle-2', createdBy: 'different-user' },
      ];
      mockPuzzleRepository.find.mockResolvedValue(mockPuzzles);

      await expect(
        service.bulkUpdate(puzzleIds, bulkUpdateDto, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAnalytics', () => {
    it('should return comprehensive analytics', async () => {
      const mockAnalytics = {
        totalPuzzles: 100,
        publishedPuzzles: 80,
        categoryCounts: { math: 30, logic: 25, word: 20 },
        difficultyDistribution: { easy: 25, medium: 40, hard: 25, expert: 10 },
        averageRating: 4.2,
        topPerformingPuzzles: [],
        recentActivity: { created: 5, published: 3, played: 150 },
      };

      // Mock the various query builder calls
      mockQueryBuilder.getCount
        .mockResolvedValueOnce(100) // totalPuzzles
        .mockResolvedValueOnce(80); // publishedPuzzles

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce([{ puzzle_category: 'math', count: '30' }])
        .mockResolvedValueOnce([{ puzzle_difficulty: 'medium', count: '40' }]);

      mockQueryBuilder.getRawOne.mockResolvedValue({ avg: '4.2' });

      mockPuzzleRepository.find.mockResolvedValue([]);

      // Mock Between calls for recent activity
      mockPuzzleRepository.count
        .mockResolvedValueOnce(5) // created
        .mockResolvedValueOnce(3); // published
      mockProgressRepository.count.mockResolvedValue(150); // played

      const result = await service.getAnalytics('week');

      expect(result).toEqual(
        expect.objectContaining({
          totalPuzzles: 100,
          publishedPuzzles: 80,
          averageRating: 4.2,
        }),
      );
    });
  });
});
