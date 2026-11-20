import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PuzzleBulkImportService } from './puzzle-bulk-import.service';
import { Puzzle } from '../entities/puzzle.entity';
import {
  PuzzleImportHistory,
  ImportStatus,
} from '../entities/puzzle-import-history.entity';
import { AdminAuditLogService } from '../../admin/services/admin-audit-log.service';
import { PuzzleImportFormat } from '../dto/puzzle-bulk-import.dto';

describe('PuzzleBulkImportService', () => {
  let service: PuzzleBulkImportService;
  let puzzleRepo: any;
  let historyRepo: any;
  let dataSource: any;
  let auditLogService: any;
  let mockEntityManager: any;

  const mockAdminId = 'admin-uuid-123';

  const validPuzzleRecord1 = {
    title: 'Valid Logic Grid Puzzle',
    description: 'This is a sufficiently long puzzle description for testing.',
    category: 'logic',
    difficulty: 'medium',
    difficultyRating: 5,
    basePoints: 150,
    timeLimit: 300,
    maxHints: 3,
    content: {
      question: 'Which element comes next in the sequence?',
      correctAnswer: 'A',
      options: ['A', 'B', 'C', 'D'],
    },
    hints: [{ order: 1, text: 'Look at the diagonals' }],
    tags: ['sequence', 'logic'],
  };

  const validPuzzleRecord2 = {
    title: 'Valid Math Riddle',
    description: 'Another full puzzle description that meets all length constraints.',
    category: 'math',
    difficulty: 'hard',
    difficultyRating: 8,
    basePoints: 200,
    timeLimit: 400,
    maxHints: 2,
    content: {
      question: 'What is the sum of angles in a triangle?',
      correctAnswer: '180',
    },
    hints: [],
    tags: ['math', 'geometry'],
  };

  const mockSavedPuzzle = {
    id: 'puzzle-saved-1',
    title: 'Valid Logic Grid Puzzle',
  };

  const mockSavedHistory: PuzzleImportHistory = {
    id: 'history-uuid-1',
    adminId: mockAdminId,
    filename: 'test.json',
    format: 'json',
    totalRecords: 2,
    importedCount: 2,
    failedCount: 0,
    isDryRun: false,
    status: ImportStatus.SUCCESS,
    report: {
      dryRun: false,
      totalRecords: 2,
      validCount: 2,
      invalidCount: 0,
      errors: [],
    },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockEntityManager = {
      create: jest.fn().mockImplementation((entityClass, data) => data),
      save: jest.fn().mockImplementation((entityClass, data) => {
        return { id: `saved-${Math.random()}`, ...data };
      }),
    };

    puzzleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    historyRepo = {
      create: jest.fn().mockImplementation((data) => ({
        id: 'history-uuid-1',
        ...data,
      })),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      findAndCount: jest.fn().mockResolvedValue([[mockSavedHistory], 1]),
      findOne: jest.fn().mockResolvedValue(mockSavedHistory),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return await cb(mockEntityManager);
      }),
    };

    auditLogService = {
      log: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleBulkImportService,
        {
          provide: getRepositoryToken(Puzzle),
          useValue: puzzleRepo,
        },
        {
          provide: getRepositoryToken(PuzzleImportHistory),
          useValue: historyRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: AdminAuditLogService,
          useValue: auditLogService,
        },
      ],
    }).compile();

    service = module.get<PuzzleBulkImportService>(PuzzleBulkImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importFromFile - Valid Files', () => {
    it('should import valid JSON files fully in a transaction and record history', async () => {
      const fileContent = JSON.stringify([validPuzzleRecord1, validPuzzleRecord2]);

      const result = await service.importFromFile(
        undefined,
        {
          fileContent,
          format: PuzzleImportFormat.JSON,
          dryRun: false,
        },
        mockAdminId,
        false,
      );

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
      expect(historyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: mockAdminId,
          totalRecords: 2,
          importedCount: 2,
          failedCount: 0,
          isDryRun: false,
          status: 'success',
        }),
      );
      expect(result.status).toBe('success');
      expect(result.totalRecords).toBe(2);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.importedPuzzles?.length).toBe(2);
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BULK_IMPORT_PUZZLES',
          adminId: mockAdminId,
        }),
      );
    });

    it('should parse and import valid CSV files fully', async () => {
      const csvContent = `title,description,category,difficulty,basePoints,timeLimit,maxHints,content,tags
Valid Logic Grid Puzzle,This is a sufficiently long puzzle description for testing.,logic,medium,150,300,3,"{""question"":""Which comes next?"",""correctAnswer"":""A""}","sequence,logic"
Valid Math Riddle,Another full puzzle description that meets all length constraints.,math,hard,200,400,2,"{""question"":""What is 2+2?"",""correctAnswer"":""4""}","math"`;

      const result = await service.importFromFile(
        {
          buffer: Buffer.from(csvContent, 'utf-8'),
          originalname: 'puzzles.csv',
        },
        {},
        mockAdminId,
        false,
      );

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('success');
      expect(result.totalRecords).toBe(2);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
    });
  });

  describe('Validation & Reporting invalid records with row numbers', () => {
    it('should report invalid records with exact row numbers and errors', async () => {
      const records = [
        validPuzzleRecord1, // Row 1 (valid)
        {
          // Row 2: invalid title, short description, invalid difficulty
          title: 'No',
          description: 'Short',
          category: '',
          difficulty: 'impossible',
          content: null,
        },
        {
          // Row 3: missing question and correctAnswer in content
          title: 'Another Broken Puzzle',
          description: 'This description is long enough to pass.',
          category: 'logic',
          content: { type: 'multiple-choice' },
        },
      ];

      const result = await service.importFromFile(
        undefined,
        {
          fileContent: JSON.stringify(records),
          format: PuzzleImportFormat.JSON,
          dryRun: false,
        },
        mockAdminId,
        false,
      );

      expect(result.status).toBe('partial');
      expect(result.totalRecords).toBe(3);
      expect(result.validCount).toBe(1);
      expect(result.invalidCount).toBe(2);

      expect(result.errors).toEqual([
        expect.objectContaining({
          row: 2,
          title: 'No',
          errors: expect.arrayContaining([
            'Title is required and must be at least 3 characters long',
            'Description is required and must be at least 10 characters long',
            'Category is required',
            expect.stringContaining('Invalid difficulty'),
            'Content configuration is required',
          ]),
        }),
        expect.objectContaining({
          row: 3,
          title: 'Another Broken Puzzle',
          errors: expect.arrayContaining([
            'Content must include a valid question of at least 5 characters',
            'Content must include a correctAnswer',
          ]),
        }),
      ]);

      // Only the 1 valid record was committed in the transaction
      expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
    });

    it('should report CSV row numbers starting at row 2 for data rows', async () => {
      const csvContent = `title,description,category,content
Valid Puzzle,This is a valid long description.,logic,"{""question"":""Valid?"",""correctAnswer"":""yes""}"
Bad,Short,,`;

      const result = await service.importFromFile(
        {
          buffer: Buffer.from(csvContent, 'utf-8'),
          originalname: 'test.csv',
        },
        {},
        mockAdminId,
        false,
      );

      expect(result.errors.length).toBe(1);
      expect(result.errors[0].row).toBe(3); // row 1 is header, row 2 is valid, row 3 is bad
      expect(result.errors[0].title).toBe('Bad');
    });
  });

  describe('Dry-run mode', () => {
    it('dry-run changes nothing in the puzzles table and returns report', async () => {
      const records = [validPuzzleRecord1, validPuzzleRecord2];

      const result = await service.importFromFile(
        undefined,
        {
          fileContent: JSON.stringify(records),
          dryRun: true,
        },
        mockAdminId,
        true,
      );

      expect(result.dryRun).toBe(true);
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.status).toBe('success');

      // Crucial: transaction should NEVER be called in dry-run mode
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();

      // Crucial: history is logged with isDryRun: true and importedCount: 0
      expect(historyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isDryRun: true,
          importedCount: 0,
          totalRecords: 2,
        }),
      );
    });
  });

  describe('Import history logging and retrieval', () => {
    it('should record history on import and retrieve paginated history', async () => {
      const historyResult = await service.getImportHistory(10, 0);

      expect(historyRepo.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
      expect(historyResult.history).toEqual([mockSavedHistory]);
      expect(historyResult.total).toBe(1);
    });

    it('should retrieve import history by id', async () => {
      const result = await service.getImportHistoryById('history-uuid-1');
      expect(historyRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'history-uuid-1' },
      });
      expect(result).toEqual(mockSavedHistory);
    });

    it('should throw NotFoundException if history record does not exist', async () => {
      historyRepo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.getImportHistoryById('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should throw BadRequestException when no data or file is provided', async () => {
      await expect(
        service.importFromFile(undefined, {}, mockAdminId, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on malformed JSON content', async () => {
      await expect(
        service.importFromFile(
          undefined,
          { fileContent: '{ invalid json }' },
          mockAdminId,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on empty CSV', async () => {
      await expect(
        service.importFromFile(
          undefined,
          { fileContent: '', format: PuzzleImportFormat.CSV },
          mockAdminId,
          false,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
