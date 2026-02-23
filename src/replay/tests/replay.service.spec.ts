import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplayService } from '../services/replay.service';
import { PuzzleReplay, ReplaySharePermission } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import { ReplayAnalytic } from '../entities/replay-analytic.entity';
import { CreateReplayDto, RecordActionDto, CompleteReplayDto } from '../dto/create-replay.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ReplayService', () => {
  let service: ReplayService;
  let replayRepo: Repository<PuzzleReplay>;
  let actionRepo: Repository<ReplayAction>;
  let analyticRepo: Repository<ReplayAnalytic>;

  const mockUserId = 'user-123';
  const mockPuzzleId = 'puzzle-456';
  const mockReplayId = 'replay-789';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayService,
        {
          provide: getRepositoryToken(PuzzleReplay),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReplayAction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReplayAnalytic),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReplayService>(ReplayService);
    replayRepo = module.get<Repository<PuzzleReplay>>(getRepositoryToken(PuzzleReplay));
    actionRepo = module.get<Repository<ReplayAction>>(getRepositoryToken(ReplayAction));
    analyticRepo = module.get<Repository<ReplayAnalytic>>(getRepositoryToken(ReplayAnalytic));
  });

  describe('createReplay', () => {
    it('should create a new replay with private permission', async () => {
      const createDto: CreateReplayDto = {
        puzzleId: mockPuzzleId,
        puzzleTitle: 'Test Puzzle',
        puzzleCategory: 'logic',
        puzzleDifficulty: 'medium',
      };

      const mockReplay = {
        id: mockReplayId,
        userId: mockUserId,
        ...createDto,
        permission: ReplaySharePermission.PRIVATE,
      };

      jest.spyOn(replayRepo, 'create').mockReturnValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue(mockReplay as any);

      const result = await service.createReplay(mockUserId, createDto);

      expect(replayRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          puzzleId: createDto.puzzleId,
          permission: ReplaySharePermission.PRIVATE,
        }),
      );
      expect(result).toEqual(mockReplay);
    });
  });

  describe('recordAction', () => {
    it('should record an action in a replay', async () => {
      const actionDto: RecordActionDto = {
        actionType: 'MOVE',
        timestamp: 1000,
        actionData: { x: 5, y: 10 },
      };

      const mockReplay = { id: mockReplayId, isCompleted: false, movesCount: 0 };
      const mockAction = { id: 'action-1', sequenceNumber: 0, ...actionDto };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(actionRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(actionRepo, 'create').mockReturnValue(mockAction as any);
      jest.spyOn(actionRepo, 'save').mockResolvedValue(mockAction as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue(mockReplay as any);

      const result = await service.recordAction(mockReplayId, actionDto);

      expect(result).toEqual(mockAction);
      expect(actionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          replayId: mockReplayId,
          actionType: 'MOVE',
          sequenceNumber: 0,
        }),
      );
    });

    it('should throw error when trying to record action on completed replay', async () => {
      const actionDto: RecordActionDto = {
        actionType: 'MOVE',
        timestamp: 1000,
      };

      const mockReplay = { id: mockReplayId, isCompleted: true };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);

      await expect(service.recordAction(mockReplayId, actionDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should increment sequence number for subsequent actions', async () => {
      const actionDto: RecordActionDto = {
        actionType: 'MOVE',
        timestamp: 2000,
        actionData: { x: 10, y: 20 },
      };

      const mockReplay = { id: mockReplayId, isCompleted: false };
      const lastAction = { sequenceNumber: 5 };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(actionRepo, 'findOne').mockResolvedValue(lastAction as any);
      jest.spyOn(actionRepo, 'create').mockReturnValue({
        sequenceNumber: 6,
      } as any);
      jest.spyOn(actionRepo, 'save').mockResolvedValue({
        sequenceNumber: 6,
      } as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue(mockReplay as any);

      const result = await service.recordAction(mockReplayId, actionDto);

      expect(result.sequenceNumber).toBe(6);
    });
  });

  describe('completeReplay', () => {
    it('should complete a replay with solved status', async () => {
      const completeDto: CompleteReplayDto = {
        isSolved: true,
        totalDuration: 5000,
        scoreEarned: 100,
        maxScorePossible: 100,
      };

      const mockReplay = {
        id: mockReplayId,
        isCompleted: false,
        scoreEarned: 0,
        maxScorePossible: 100,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue({
        ...mockReplay,
        ...completeDto,
        isCompleted: true,
        efficiency: 100,
      } as any);

      const result = await service.completeReplay(mockReplayId, completeDto);

      expect(result.isCompleted).toBe(true);
      expect(result.isSolved).toBe(true);
      expect(result.efficiency).toBe(100);
    });

    it('should calculate efficiency percentage', async () => {
      const completeDto: CompleteReplayDto = {
        isSolved: true,
        scoreEarned: 75,
        maxScorePossible: 100,
      };

      const mockReplay = { id: mockReplayId, isCompleted: false };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue({
        ...mockReplay,
        ...completeDto,
        isCompleted: true,
        efficiency: 75,
      } as any);

      const result = await service.completeReplay(mockReplayId, completeDto);

      expect(result.efficiency).toBe(75);
    });
  });

  describe('getReplay', () => {
    it('should retrieve a replay by ID', async () => {
      const mockReplay = {
        id: mockReplayId,
        userId: mockUserId,
        puzzleId: mockPuzzleId,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);

      const result = await service.getReplay(mockReplayId);

      expect(result).toEqual(mockReplay);
      expect(replayRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockReplayId },
      });
    });

    it('should throw NotFoundException when replay does not exist', async () => {
      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getReplay(mockReplayId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPlaybackData', () => {
    it('should retrieve playback data with actions ordered by sequence', async () => {
      const mockReplay = {
        id: mockReplayId,
        puzzleTitle: 'Test',
        puzzleCategory: 'logic',
        puzzleDifficulty: 'medium',
        movesCount: 5,
      };

      const mockActions = [
        { sequenceNumber: 0, actionType: 'MOVE', timestamp: 100 },
        { sequenceNumber: 1, actionType: 'MOVE', timestamp: 200 },
      ];

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(actionRepo, 'find').mockResolvedValue(mockActions as any);

      const result = await service.getPlaybackData(mockReplayId);

      expect(result.metadata.movesCount).toBe(5);
      expect(result.totalActions).toBe(2);
      expect(result.actions).toHaveLength(2);
    });
  });

  describe('getUserReplays', () => {
    it('should retrieve paginated user replays', async () => {
      const mockReplays = [
        { id: 'replay-1', userId: mockUserId, isCompleted: true },
        { id: 'replay-2', userId: mockUserId, isCompleted: false },
      ];

      const mockQueryBuilder = {
        createQueryBuilder: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(2),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(mockReplays),
        }),
      };

      jest
        .spyOn(replayRepo, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getUserReplays(mockUserId, 1, 20);

      expect(result.replays).toEqual(mockReplays);
      expect(result.total).toBe(2);
    });
  });

  describe('shareReplay', () => {
    it('should generate share code for shared_link permission', async () => {
      const mockReplay = { id: mockReplayId, userId: mockUserId, permission: 'private' };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockImplementation((replay) => {
        return Promise.resolve({
          ...replay,
          permission: 'shared_link',
          shareCode: expect.any(String),
        } as any);
      });

      const shareDto = { permission: 'shared_link' };

      const result = await service.shareReplay(mockReplayId, mockUserId, shareDto as any);

      expect(result.permission).toBe('shared_link');
      expect(result.shareCode).toBeDefined();
    });
  });

  describe('getSharedReplay', () => {
    it('should retrieve shared replay by share code', async () => {
      const shareCode = 'ABC123DEF456';
      const mockReplay = {
        id: mockReplayId,
        shareCode,
        permission: 'shared_link',
        viewCount: 5,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue({
        ...mockReplay,
        viewCount: 6,
      } as any);

      const result = await service.getSharedReplay(shareCode);

      expect(result.viewCount).toBe(6);
    });

    it('should throw error for expired shares', async () => {
      const shareCode = 'ABC123DEF456';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const mockReplay = {
        id: mockReplayId,
        shareCode,
        permission: 'shared_link',
        shareExpiredAt: pastDate,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);

      await expect(service.getSharedReplay(shareCode)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteReplay', () => {
    it('should soft delete a replay', async () => {
      const mockReplay = { id: mockReplayId, userId: mockUserId, archiveStatus: 'active' };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue({
        ...mockReplay,
        archiveStatus: 'deleted',
      } as any);

      await service.deleteReplay(mockReplayId, mockUserId);

      expect(replayRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          archiveStatus: 'deleted',
        }),
      );
    });
  });

  describe('recordAnalytic', () => {
    it('should record an analytic event', async () => {
      const mockAnalytic = {
        id: 'analytic-1',
        replayId: mockReplayId,
        metricType: 'VIEW',
        metricValue: { viewedAt: new Date() },
      };

      jest.spyOn(analyticRepo, 'create').mockReturnValue(mockAnalytic as any);
      jest.spyOn(analyticRepo, 'save').mockResolvedValue(mockAnalytic as any);

      const result = await service.recordAnalytic(
        mockReplayId,
        'VIEW',
        mockAnalytic.metricValue,
      );

      expect(result).toEqual(mockAnalytic);
    });
  });
});
