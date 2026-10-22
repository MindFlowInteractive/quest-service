import { Test, TestingModule } from '@nestjs/testing';
import { AdminPuzzlesController } from '../admin-puzzles.controller';
import { PuzzlesService } from '../../../puzzles/puzzles.service';
import { AdminAuditLogService } from '../../services/admin-audit-log.service';
import { UserRole } from '../../../auth/constants';

describe('AdminPuzzlesController', () => {
  let controller: AdminPuzzlesController;
  let puzzlesService: PuzzlesService;
  let auditLogService: AdminAuditLogService;

  const mockUser = { id: 'admin-id', role: { name: UserRole.ADMIN } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPuzzlesController],
      providers: [
        {
          provide: PuzzlesService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            archive: jest.fn(),
            restore: jest.fn(),
          },
        },
        {
          provide: AdminAuditLogService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminPuzzlesController>(AdminPuzzlesController);
    puzzlesService = module.get<PuzzlesService>(PuzzlesService);
    auditLogService = module.get<AdminAuditLogService>(AdminAuditLogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call puzzlesService.findAll', async () => {
      const searchDto = {};
      await controller.findAll(searchDto);
      expect(puzzlesService.findAll).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('create', () => {
    it('should call puzzlesService.create and auditLogService.log', async () => {
      const createDto = { title: 'New Puzzle' } as any;
      const mockPuzzle = { id: 'puzzle-id', title: 'New Puzzle' };
      (puzzlesService.create as jest.Mock).mockResolvedValue(mockPuzzle);

      await controller.create(createDto, mockUser);

      expect(puzzlesService.create).toHaveBeenCalledWith(
        createDto,
        mockUser.id,
      );
      expect(auditLogService.log).toHaveBeenCalledWith({
        adminId: mockUser.id,
        action: 'CREATE_PUZZLE',
        targetType: 'PUZZLE',
        targetId: mockPuzzle.id,
        details: { title: mockPuzzle.title },
      });
    });
  });

  describe('archive', () => {
    it('should call puzzlesService.archive and auditLogService.log', async () => {
      const mockPuzzle = { id: 'puzzle-id', title: 'Archived Puzzle' };
      (puzzlesService.archive as jest.Mock).mockResolvedValue(mockPuzzle);

      const result = await controller.archive('puzzle-id', mockUser);

      expect(puzzlesService.archive).toHaveBeenCalledWith(
        'puzzle-id',
        mockUser.id,
      );
      expect(auditLogService.log).toHaveBeenCalledWith({
        adminId: mockUser.id,
        action: 'ARCHIVE_PUZZLE',
        targetType: 'PUZZLE',
        targetId: 'puzzle-id',
        details: { title: mockPuzzle.title },
      });
      expect(result).toEqual(mockPuzzle);
    });
  });

  describe('restore', () => {
    it('should call puzzlesService.restore and auditLogService.log with actor details', async () => {
      const mockPuzzle = { id: 'puzzle-id', title: 'Restored Puzzle' };
      (puzzlesService.restore as jest.Mock).mockResolvedValue(mockPuzzle);

      const result = await controller.restore('puzzle-id', mockUser);

      expect(puzzlesService.restore).toHaveBeenCalledWith(
        'puzzle-id',
        mockUser.id,
      );
      expect(auditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          adminId: mockUser.id,
          action: 'RESTORE_PUZZLE',
          targetType: 'PUZZLE',
          targetId: 'puzzle-id',
          details: expect.objectContaining({
            title: mockPuzzle.title,
            restoredBy: mockUser.id,
          }),
        }),
      );
      expect(result).toEqual(mockPuzzle);
    });
  });
});
