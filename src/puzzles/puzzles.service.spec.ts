import { Test, TestingModule } from '@nestjs/testing';
import { PuzzlesService } from './puzzles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';
import { LocalizationService } from '../common/i18n/localization.service';
import { PuzzleVersionService } from './services/puzzle-version.service';
import { PuzzleValidationService } from './services/puzzle-validation.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PuzzlesService', () => {
  let service: PuzzlesService;
  let puzzleRepository: any;
  let validationService: any;
  let mockQueryBuilder: any;

  const validPuzzle: any = {
    id: 'puzzle-123',
    title: 'Valid Puzzle Title',
    description: 'This is a sufficiently long puzzle description.',
    category: 'logic',
    difficulty: 'medium',
    difficultyRating: 5,
    basePoints: 100,
    timeLimit: 300,
    maxHints: 3,
    isActive: true,
    attempts: 10,
    completions: 8,
    averageRating: 4.5,
    averageCompletionTime: 120,
    content: {
      type: 'multiple-choice',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5'],
      correctAnswer: '4',
    },
    hints: [],
    tags: ['math', 'logic'],
    tagEntities: [],
    metadata: {},
  };

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      withDeleted: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
      clone: jest.fn().mockReturnThis(),
    };

    const mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn().mockImplementation(async (p: any) => p || validPuzzle),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      restore: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzlesService,
        { provide: getRepositoryToken(Puzzle), useValue: mockRepo },
        {
          provide: getRepositoryToken(PuzzleProgress),
          useValue: { ...mockRepo },
        },
        {
          provide: getRepositoryToken(PuzzleRating),
          useValue: { ...mockRepo },
        },
        {
          provide: LocalizationService,
          useValue: {
            translate: jest.fn((key, options) =>
              Promise.resolve(options?.defaultValue || key),
            ),
          },
        },
        {
          provide: PuzzleVersionService,
          useValue: {
            snapshotBefore: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PuzzleValidationService,
          useValue: {
            validatePuzzle: jest
              .fn()
              .mockResolvedValue({ isValid: true, errors: [] }),
            validatePuzzleForRestore: jest
              .fn()
              .mockReturnValue({ isValid: true, errors: [] }),
          },
        },
      ],
    }).compile();

    service = module.get<PuzzlesService>(PuzzlesService);
    puzzleRepository = module.get(getRepositoryToken(Puzzle));
    validationService = module.get<PuzzleValidationService>(
      PuzzleValidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('archive', () => {
    it('should archive an active puzzle and record actor and timestamp', async () => {
      const activePuzzle = {
        ...validPuzzle,
        deletedAt: null,
        archivedAt: null,
        isActive: true,
      };
      mockQueryBuilder.getOne.mockResolvedValueOnce(activePuzzle);

      const result = await service.archive('puzzle-123', 'admin-user-1');

      expect(puzzleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          archivedAt: expect.any(Date),
          isActive: false,
          metadata: expect.objectContaining({
            archivedBy: 'admin-user-1',
          }),
        }),
      );
      expect(puzzleRepository.softDelete).toHaveBeenCalledWith('puzzle-123');
      expect(result.id).toBe('puzzle-123');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if puzzle does not exist or is already archived', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(
        service.archive('missing-id', 'admin-user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore an archived puzzle, clear archivedAt/deletedAt, audit actor and timestamp, and re-index for search', async () => {
      const archivedPuzzle = {
        ...validPuzzle,
        deletedAt: new Date(),
        archivedAt: new Date(),
        isActive: false,
        metadata: {},
      };
      mockQueryBuilder.getOne.mockResolvedValueOnce(archivedPuzzle);
      const reindexSpy = jest
        .spyOn(service, 'reindexPuzzle')
        .mockResolvedValueOnce(undefined);

      const result = await service.restore('puzzle-123', 'admin-user-1');

      expect(validationService.validatePuzzleForRestore).toHaveBeenCalledWith(
        archivedPuzzle,
      );
      expect(puzzleRepository.restore).toHaveBeenCalledWith('puzzle-123');
      expect(puzzleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
          archivedAt: null,
          isActive: true,
          restoredBy: 'admin-user-1',
          restoredAt: expect.any(Date),
          metadata: expect.objectContaining({
            restoredBy: 'admin-user-1',
            restoredAt: expect.any(String),
          }),
        }),
      );
      expect(reindexSpy).toHaveBeenCalled();
      expect(result.id).toBe('puzzle-123');
      expect(result.isActive).toBe(true);
    });

    it('should throw NotFoundException if puzzle does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);

      await expect(
        service.restore('missing-id', 'admin-user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if puzzle is not archived', async () => {
      const unarchivedPuzzle = {
        ...validPuzzle,
        deletedAt: null,
        archivedAt: null,
        isActive: true,
      };
      mockQueryBuilder.getOne.mockResolvedValueOnce(unarchivedPuzzle);

      await expect(
        service.restore('puzzle-123', 'admin-user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should block restore if puzzle fails validation', async () => {
      const invalidArchivedPuzzle = {
        ...validPuzzle,
        deletedAt: new Date(),
        archivedAt: new Date(),
        title: '',
      };
      mockQueryBuilder.getOne.mockResolvedValueOnce(invalidArchivedPuzzle);
      validationService.validatePuzzleForRestore.mockReturnValueOnce({
        isValid: false,
        errors: ['Title must be at least 3 characters long'],
      });

      await expect(
        service.restore('puzzle-123', 'admin-user-1'),
      ).rejects.toThrow(BadRequestException);
      expect(puzzleRepository.restore).not.toHaveBeenCalled();
    });
  });

  describe('reindexPuzzle', () => {
    it('should touch updatedAt timestamp to re-index puzzle for search', async () => {
      await service.reindexPuzzle(validPuzzle);

      expect(puzzleRepository.update).toHaveBeenCalledWith(
        validPuzzle.id,
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      );
    });
  });
});
