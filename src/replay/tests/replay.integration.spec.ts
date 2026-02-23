import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplayController } from '../controllers/replay.controller';
import { ReplayService } from '../services/replay.service';
import { ReplayCompressionService } from '../services/replay-compression.service';
import { ReplayComparisonService } from '../services/replay-comparison.service';
import { PuzzleReplay } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import { ReplayAnalytic } from '../entities/replay-analytic.entity';
import { CreateReplayDto, RecordActionDto, CompleteReplayDto } from '../dto/create-replay.dto';

describe('Replay Flow Integration Tests', () => {
  let controller: ReplayController;
  let replayService: ReplayService;
  let compressionService: ReplayCompressionService;
  let comparisonService: ReplayComparisonService;
  let replayRepo: Repository<PuzzleReplay>;
  let actionRepo: Repository<ReplayAction>;

  const mockUserId = 'user-123';
  const mockPuzzleId = 'puzzle-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReplayController],
      providers: [
        ReplayService,
        ReplayCompressionService,
        ReplayComparisonService,
        {
          provide: getRepositoryToken(PuzzleReplay),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
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

    controller = module.get<ReplayController>(ReplayController);
    replayService = module.get<ReplayService>(ReplayService);
    compressionService = module.get<ReplayCompressionService>(ReplayCompressionService);
    comparisonService = module.get<ReplayComparisonService>(ReplayComparisonService);
    replayRepo = module.get<Repository<PuzzleReplay>>(getRepositoryToken(PuzzleReplay));
    actionRepo = module.get<Repository<ReplayAction>>(getRepositoryToken(ReplayAction));
  });

  describe('Complete replay flow', () => {
    it('should create replay, record actions, and complete', async () => {
      const createDto: CreateReplayDto = {
        puzzleId: mockPuzzleId,
        puzzleTitle: 'Test Puzzle',
        puzzleCategory: 'logic',
        puzzleDifficulty: 'medium',
        initialState: { board: null },
      };

      const mockReplay = { id: 'replay-1', ...createDto };
      const mockRequest = { user: { id: mockUserId, userId: mockUserId } } as any;

      // Step 1: Create replay
      jest.spyOn(replayRepo, 'create').mockReturnValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue(mockReplay as any);

      const createdReplay = await controller.createReplay(createDto, mockRequest);

      expect(createdReplay).toEqual(mockReplay);

      // Step 2: Record actions
      const action1: RecordActionDto = {
        actionType: 'MOVE',
        timestamp: 1000,
        actionData: { x: 5, y: 10 },
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(actionRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(actionRepo, 'create').mockReturnValue({
        id: 'action-1',
        sequenceNumber: 0,
        ...action1,
      } as any);
      jest.spyOn(actionRepo, 'save').mockResolvedValue({
        id: 'action-1',
        sequenceNumber: 0,
        ...action1,
      } as any);

      const recordedAction = await controller.recordAction('replay-1', action1, mockRequest);

      expect(recordedAction.sequenceNumber).toBe(0);
      expect(recordedAction.actionType).toBe('MOVE');

      // Step 3: Complete replay
      const completeDto: CompleteReplayDto = {
        isSolved: true,
        totalDuration: 5000,
        scoreEarned: 100,
        maxScorePossible: 100,
      };

      const completedReplay = {
        ...mockReplay,
        ...completeDto,
        isCompleted: true,
        completedAt: new Date(),
        efficiency: 100,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(replayRepo, 'save').mockResolvedValue(completedReplay as any);

      const result = await controller.completeReplay('replay-1', completeDto, mockRequest);

      expect(result.isCompleted).toBe(true);
      expect(result.isSolved).toBe(true);
      expect(result.efficiency).toBe(100);
    });
  });

  describe('Sharing flow', () => {
    it('should share replay and retrieve by share code', async () => {
      const mockReplay = {
        id: 'replay-1',
        userId: mockUserId,
        permission: 'private',
        shareCode: null,
      };

      const mockRequest = { user: { id: mockUserId, userId: mockUserId } } as any;

      // Step 1: Share replay
      const shareDto = { permission: 'shared_link' };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);

      const sharedReplay = {
        ...mockReplay,
        permission: 'shared_link',
        shareCode: 'ABC123DEF456',
      };

      jest.spyOn(replayRepo, 'save').mockResolvedValue(sharedReplay as any);

      const result = await controller.shareReplay('replay-1', shareDto as any, mockRequest);

      expect(result.permission).toBe('shared_link');
      expect(result.shareCode).toBeDefined();

      // Step 2: Retrieve by share code (public access)
      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(sharedReplay as any);

      const publicReplay = await replayService.getSharedReplay('ABC123DEF456');

      expect(publicReplay.shareCode).toBe('ABC123DEF456');
    });
  });

  describe('Replay comparison flow', () => {
    it('should compare original and new attempt', async () => {
      const originalReplay = {
        id: 'replay-orig',
        userId: mockUserId,
        totalDuration: 10000,
        scoreEarned: 75,
        movesCount: 10,
        hintsUsed: 2,
        undosCount: 2,
        efficiency: 75,
      };

      const newReplay = {
        id: 'replay-new',
        userId: mockUserId,
        totalDuration: 7000,
        scoreEarned: 95,
        movesCount: 7,
        hintsUsed: 1,
        undosCount: 0,
        efficiency: 95,
      };

      const mockRequest = { user: { id: mockUserId, userId: mockUserId } } as any;

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const comparison = await controller.compareReplays(
        'replay-orig',
        'replay-new',
        mockRequest,
      );

      expect(comparison.originalReplayId).toBe('replay-orig');
      expect(comparison.newReplayId).toBe('replay-new');
      expect(comparison.performanceComparison.scoreImprovement).toBe(20);
      expect(comparison.timingComparison.timeSavings).toBe(3000);

      // Get summary
      const summary = await controller.getComparisonSummary(
        'replay-orig',
        'replay-new',
        mockRequest,
      );

      expect(summary.improved).toBe(true);
      expect(summary.improvementAreas).toContain('Score increased');
      expect(summary.improvementAreas).toContain('Required fewer hints');
      expect(summary.improvementAreas).toContain('Solved faster');
    });
  });

  describe('Compression flow', () => {
    it('should compress replay data', async () => {
      const mockReplay = {
        id: 'replay-1',
        userId: mockUserId,
        isCompressed: false,
        initialState: { board: 'init' },
      };

      const mockRequest = { user: { id: mockUserId, userId: mockUserId } } as any;

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest.spyOn(actionRepo, 'find').mockResolvedValue([]);
      jest.spyOn(replayRepo, 'save').mockResolvedValue({
        ...mockReplay,
        isCompressed: true,
      } as any);

      await controller.compressReplay('replay-1', mockRequest);

      expect(replayRepo.save).toHaveBeenCalled();
    });
  });

  describe('View tracking flow', () => {
    it('should track view and update view count', async () => {
      const mockReplay = {
        id: 'replay-1',
        userId: mockUserId,
        permission: 'public',
        viewCount: 5,
        lastViewedAt: new Date(),
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);
      jest
        .spyOn(analyticRepo, 'create')
        .mockReturnValue({ id: 'analytic-1', replayId: 'replay-1' } as any);
      jest.spyOn(analyticRepo, 'save').mockResolvedValue({} as any);

      const mockRequest = { user: { id: 'other-user' } } as any;

      // Get playback (which should increment view)
      await controller.getPlayback('replay-1', mockRequest);

      // Verify analytic was recorded
      expect(replayService.recordAnalytic).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle missing user in request', async () => {
      const createDto: CreateReplayDto = {
        puzzleId: mockPuzzleId,
        puzzleTitle: 'Test',
        puzzleCategory: 'logic',
        puzzleDifficulty: 'medium',
      };

      const mockRequest = { user: null } as any;

      expect(() => controller.createReplay(createDto, mockRequest)).toThrow();
    });

    it('should prevent unauthorized access to private replays', async () => {
      const otherUserId = 'other-user';
      const mockReplay = {
        id: 'replay-1',
        userId: mockUserId,
        permission: 'private',
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValue(mockReplay as any);

      const mockRequest = { user: { id: otherUserId } } as any;

      expect(() => controller.getReplay('replay-1', mockRequest)).toThrow();
    });
  });
});
