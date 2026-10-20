import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReplayService } from '../../replay/services/replay.service';
import { GameMode } from '../types/move-history.types';
import { MoveHistoryService } from '../services/move-history.service';
import { PuzzleEngineService } from '../services/puzzle-engine.service';
import { MoveHistoryController } from './move-history.controller';

describe('MoveHistoryController', () => {
  let controller: MoveHistoryController;
  let testingModule: TestingModule;
  let puzzleEngine: { undoMove: jest.Mock; redoMove: jest.Mock };
  let moveHistory: {
    getPolicy: jest.Mock;
    getHistory: jest.Mock;
    toReplayActions: jest.Mock;
    toReplayAction: jest.Mock;
  };
  let replayService: { recordAction: jest.Mock };

  const policy = {
    mode: GameMode.PRACTICE,
    puzzleType: 'logic_grid',
    maxUndoDepth: 5,
    undoAllowed: true,
    undoPenalty: 0,
    redoPenalty: 0,
    canUndo: true,
    canRedo: false,
  };

  beforeEach(async () => {
    puzzleEngine = {
      undoMove: jest.fn(),
      redoMove: jest.fn(),
    };

    moveHistory = {
      getPolicy: jest.fn().mockReturnValue(policy),
      getHistory: jest.fn().mockReturnValue({
        entries: [],
        undoCount: 0,
        redoCount: 0,
        totalPenalty: 0,
      }),
      toReplayActions: jest.fn().mockReturnValue([]),
      toReplayAction: jest.fn().mockReturnValue({
        actionType: 'UNDO',
        timestamp: 0,
        actionData: {},
        metadata: {},
      }),
    };

    replayService = { recordAction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoveHistoryController],
      providers: [
        { provide: PuzzleEngineService, useValue: puzzleEngine },
        { provide: MoveHistoryService, useValue: moveHistory },
        { provide: ReplayService, useValue: replayService },
      ],
    }).compile();

    testingModule = module;
    controller = module.get<MoveHistoryController>(MoveHistoryController);
  });

  afterEach(async () => {
    await testingModule.close();
  });

  it('undoes a move and returns the restored state', async () => {
    const state = { puzzleId: 'puzzle-1' };
    puzzleEngine.undoMove.mockResolvedValue({
      state,
      entry: { action: 'undo' },
      scorePenalty: 0,
    });

    const result = await controller.undo('puzzle-1', 'player-1', {});

    expect(result.undone).toBe(true);
    expect(result.state).toBe(state);
    expect(puzzleEngine.undoMove).toHaveBeenCalledWith('puzzle-1', 'player-1');
    expect(result.policy).toEqual(policy);
  });

  it('redoes a move and returns the restored state', async () => {
    const state = { puzzleId: 'puzzle-1' };
    puzzleEngine.redoMove.mockResolvedValue({
      state,
      entry: { action: 'redo' },
      scorePenalty: 0,
    });

    const result = await controller.redo('puzzle-1', 'player-1', {});

    expect(result.redone).toBe(true);
    expect(result.state).toBe(state);
    expect(puzzleEngine.redoMove).toHaveBeenCalledWith('puzzle-1', 'player-1');
  });

  it('mirrors the undo onto a replay when one is given', async () => {
    puzzleEngine.undoMove.mockResolvedValue({
      state: {},
      entry: { action: 'undo' },
      scorePenalty: 0,
    });

    await controller.undo('puzzle-1', 'player-1', { replayId: 'replay-1' });

    expect(replayService.recordAction).toHaveBeenCalledWith(
      'replay-1',
      expect.objectContaining({ actionType: 'UNDO' }),
    );
  });

  it('does not touch a replay when none is given', async () => {
    puzzleEngine.undoMove.mockResolvedValue({
      state: {},
      entry: { action: 'undo' },
      scorePenalty: 0,
    });

    await controller.undo('puzzle-1', 'player-1', {});

    expect(replayService.recordAction).not.toHaveBeenCalled();
  });

  it('returns the move history and the effective policy', async () => {
    moveHistory.getHistory.mockReturnValue({
      entries: [{ sequence: 1 }],
      undoCount: 1,
      redoCount: 0,
      totalPenalty: 0,
    });

    const result = await controller.getMoveHistory('puzzle-1', 'player-1', {});

    expect(result.entries).toHaveLength(1);
    expect(result.undoCount).toBe(1);
    expect(result.policy).toEqual(policy);
  });

  it('includes the replay actions when they are requested', async () => {
    moveHistory.toReplayActions.mockReturnValue([{ actionType: 'MOVE' }]);

    const result = await controller.getMoveHistory('puzzle-1', 'player-1', {
      includeReplayActions: 'true',
    });

    expect(result.replayActions).toHaveLength(1);
  });

  it('leaves the replay actions out by default', async () => {
    const result = await controller.getMoveHistory('puzzle-1', 'player-1', {});

    expect(result.replayActions).toBeUndefined();
  });

  it('propagates a rejected undo', async () => {
    puzzleEngine.undoMove.mockRejectedValue(
      new ForbiddenException('Undo is disabled in ranked mode'),
    );

    await expect(controller.undo('puzzle-1', 'player-1', {})).rejects.toThrow(
      ForbiddenException,
    );
  });
});
