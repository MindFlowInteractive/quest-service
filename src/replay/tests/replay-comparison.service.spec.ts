import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplayComparisonService } from '../services/replay-comparison.service';
import { PuzzleReplay } from '../entities/puzzle-replay.entity';
import { ReplayAction } from '../entities/replay-action.entity';
import { NotFoundException } from '@nestjs/common';

describe('ReplayComparisonService', () => {
  let service: ReplayComparisonService;
  let replayRepo: Repository<PuzzleReplay>;
  let actionRepo: Repository<ReplayAction>;

  const mockUserId = 'user-123';
  const mockPuzzleId = 'puzzle-456';
  const mockOriginalReplayId = 'replay-orig';
  const mockNewReplayId = 'replay-new';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayComparisonService,
        {
          provide: getRepositoryToken(PuzzleReplay),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ReplayAction),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReplayComparisonService>(ReplayComparisonService);
    replayRepo = module.get<Repository<PuzzleReplay>>(getRepositoryToken(PuzzleReplay));
    actionRepo = module.get<Repository<ReplayAction>>(getRepositoryToken(ReplayAction));
  });

  describe('compareReplays', () => {
    it('should compare two replays and return differences', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 10000,
        scoreEarned: 75,
        maxScorePossible: 100,
        movesCount: 10,
        hintsUsed: 2,
        undosCount: 3,
        efficiency: 75,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 8000,
        scoreEarned: 90,
        maxScorePossible: 100,
        movesCount: 8,
        hintsUsed: 1,
        undosCount: 1,
        efficiency: 90,
      };

      const originalActions = [
        { sequenceNumber: 0, actionType: 'MOVE', timestamp: 100, actionData: { x: 1 } },
        { sequenceNumber: 1, actionType: 'MOVE', timestamp: 200, actionData: { x: 2 } },
        { sequenceNumber: 2, actionType: 'HINT_USED', timestamp: 300, actionData: {} },
      ];

      const newActions = [
        { sequenceNumber: 0, actionType: 'MOVE', timestamp: 100, actionData: { x: 1 } },
        { sequenceNumber: 1, actionType: 'MOVE', timestamp: 150, actionData: { x: 2 } },
      ];

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce(originalActions as any)
        .mockResolvedValueOnce(newActions as any);

      const result = await service.compareReplays(mockOriginalReplayId, mockNewReplayId);

      expect(result.originalReplayId).toBe(mockOriginalReplayId);
      expect(result.newReplayId).toBe(mockNewReplayId);
      expect(result.timingComparison.timeSavings).toBe(2000);
      expect(result.performanceComparison.scoreImprovement).toBe(15);
      expect(result.performanceComparison.hintsReduction).toBe(1);
    });

    it('should throw NotFoundException when original replay not found', async () => {
      jest.spyOn(replayRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.compareReplays(mockOriginalReplayId, mockNewReplayId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when new replay not found', async () => {
      const mockReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
      };

      jest.spyOn(replayRepo, 'findOne').mockResolvedValueOnce(mockReplay as any);
      jest.spyOn(replayRepo, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.compareReplays(mockOriginalReplayId, mockNewReplayId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getComparisonSummary', () => {
    it('should generate summary showing improvements', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 10000,
        scoreEarned: 75,
        maxScorePossible: 100,
        hintsUsed: 2,
        undosCount: 3,
        efficiency: 75,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 8000,
        scoreEarned: 90,
        maxScorePossible: 100,
        hintsUsed: 1,
        undosCount: 1,
        efficiency: 90,
      };

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const summary = await service.getComparisonSummary(mockOriginalReplayId, mockNewReplayId);

      expect(summary.improved).toBe(true);
      expect(summary.improvementAreas).toContain('Score increased');
      expect(summary.improvementAreas).toContain('Required fewer hints');
      expect(summary.improvementAreas).toContain('Solved faster');
    });

    it('should identify areas for improvement', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        scoreEarned: 100,
        maxScorePossible: 100,
        hintsUsed: 0,
        undosCount: 0,
        efficiency: 100,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 10000, // Took longer
        scoreEarned: 100,
        maxScorePossible: 100,
        hintsUsed: 2, // Used more hints
        undosCount: 2,
        efficiency: 100,
      };

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const summary = await service.getComparisonSummary(mockOriginalReplayId, mockNewReplayId);

      expect(summary.areasForImprovement).toContain('Took longer to solve');
    });
  });

  describe('action comparison', () => {
    it('should identify inserted actions', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        movesCount: 2,
        scoreEarned: 50,
        hintsUsed: 0,
        undosCount: 0,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 7000,
        movesCount: 3,
        scoreEarned: 50,
        hintsUsed: 0,
        undosCount: 0,
      };

      const originalActions = [
        { sequenceNumber: 0, actionType: 'MOVE', actionData: { x: 1 } },
        { sequenceNumber: 1, actionType: 'MOVE', actionData: { x: 2 } },
      ];

      const newActions = [
        { sequenceNumber: 0, actionType: 'MOVE', actionData: { x: 1 } },
        { sequenceNumber: 1, actionType: 'MOVE', actionData: { x: 1.5 } },
        { sequenceNumber: 2, actionType: 'MOVE', actionData: { x: 2 } },
      ];

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce(originalActions as any)
        .mockResolvedValueOnce(newActions as any);

      const result = await service.compareReplays(mockOriginalReplayId, mockNewReplayId);

      expect(result.actionDifferences.totalDifferenceCount).toBeGreaterThan(0);
    });
  });

  describe('timing comparison', () => {
    it('should calculate time savings', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 10000,
        scoreEarned: 75,
        hintsUsed: 2,
        undosCount: 1,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 6000,
        scoreEarned: 75,
        hintsUsed: 2,
        undosCount: 1,
      };

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.compareReplays(mockOriginalReplayId, mockNewReplayId);

      expect(result.timingComparison.timeSavings).toBe(4000);
      expect(result.timingComparison.timeSavingsPercentage).toBe(40);
    });
  });

  describe('performance comparison', () => {
    it('should calculate score improvement', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        scoreEarned: 50,
        hintsUsed: 3,
        undosCount: 2,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        scoreEarned: 80,
        hintsUsed: 1,
        undosCount: 0,
      };

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.compareReplays(mockOriginalReplayId, mockNewReplayId);

      expect(result.performanceComparison.scoreImprovement).toBe(30);
      expect(result.performanceComparison.hintsReduction).toBe(2);
    });
  });

  describe('learning metrics', () => {
    it('should calculate optimization level', async () => {
      const originalReplay = {
        id: mockOriginalReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        scoreEarned: 50,
        maxScorePossible: 100,
        hintsUsed: 2,
        undosCount: 2,
        efficiency: 50,
        movesCount: 10,
      };

      const newReplay = {
        id: mockNewReplayId,
        userId: mockUserId,
        totalDuration: 5000,
        scoreEarned: 100,
        maxScorePossible: 100,
        hintsUsed: 0,
        undosCount: 0,
        efficiency: 100,
        movesCount: 5,
      };

      jest
        .spyOn(replayRepo, 'findOne')
        .mockResolvedValueOnce(originalReplay as any)
        .mockResolvedValueOnce(newReplay as any);

      jest
        .spyOn(actionRepo, 'find')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.compareReplays(mockOriginalReplayId, mockNewReplayId);

      expect(result.learningMetrics.optimizationLevel).toBeGreaterThan(0);
      expect(result.learningMetrics.mistakesReduced).toBe(true);
      expect(result.learningMetrics.strategyImprovement).toBe(true);
    });
  });
});
