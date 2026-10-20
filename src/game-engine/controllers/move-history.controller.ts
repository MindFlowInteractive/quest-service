import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReplayService } from '../../replay/services/replay.service';
import { MoveHistoryQueryDto, UndoRedoDto } from '../dto/move-history.dto';
import { MoveHistoryService } from '../services/move-history.service';
import { PuzzleEngineService } from '../services/puzzle-engine.service';
import type { MoveHistoryEntry } from '../types/move-history.types';

/**
 * Exposes the move history of a puzzle session and the undo/redo actions
 * that operate on it.
 */
@Controller('puzzles')
export class MoveHistoryController {
  constructor(
    private readonly puzzleEngine: PuzzleEngineService,
    private readonly moveHistory: MoveHistoryService,
    private readonly replayService: ReplayService,
  ) {}

  /**
   * Restores the state that preceded the most recent move.
   *
   * Ranked sessions reject the request outright; sessions in a penalised mode
   * accept it but return the score penalty that was charged.
   */
  @Post(':puzzleId/player/:playerId/undo')
  async undo(
    @Param('puzzleId') puzzleId: string,
    @Param('playerId') playerId: string,
    @Body() dto: UndoRedoDto,
  ) {
    const result = await this.puzzleEngine.undoMove(puzzleId, playerId);
    await this.mirrorToReplay(dto?.replayId, result.entry);

    return {
      undone: true,
      state: result.state,
      entry: result.entry,
      scorePenalty: result.scorePenalty,
      policy: this.moveHistory.getPolicy(puzzleId, playerId),
    };
  }

  /**
   * Re-applies the move that was most recently undone.
   */
  @Post(':puzzleId/player/:playerId/redo')
  async redo(
    @Param('puzzleId') puzzleId: string,
    @Param('playerId') playerId: string,
    @Body() dto: UndoRedoDto,
  ) {
    const result = await this.puzzleEngine.redoMove(puzzleId, playerId);
    await this.mirrorToReplay(dto?.replayId, result.entry);

    return {
      redone: true,
      state: result.state,
      entry: result.entry,
      scorePenalty: result.scorePenalty,
      policy: this.moveHistory.getPolicy(puzzleId, playerId),
    };
  }

  /**
   * The ordered move history of a session, ready to be replayed.
   */
  @Get(':puzzleId/player/:playerId/move-history')
  async getMoveHistory(
    @Param('puzzleId') puzzleId: string,
    @Param('playerId') playerId: string,
    @Query() query: MoveHistoryQueryDto,
  ) {
    const history = this.moveHistory.getHistory(puzzleId, playerId);

    const response: Record<string, any> = {
      puzzleId,
      playerId,
      entries: history?.entries ?? [],
      undoCount: history?.undoCount ?? 0,
      redoCount: history?.redoCount ?? 0,
      totalPenalty: history?.totalPenalty ?? 0,
      policy: this.moveHistory.getPolicy(puzzleId, playerId),
    };

    if (query?.includeReplayActions === 'true') {
      response.replayActions = this.moveHistory.toReplayActions(
        puzzleId,
        playerId,
      );
    }

    return response;
  }

  /**
   * Mirrors an undo/redo action onto a replay, so the replay shows exactly
   * what the player did.
   */
  private async mirrorToReplay(
    replayId: string | undefined,
    entry: MoveHistoryEntry,
  ): Promise<void> {
    if (!replayId) {
      return;
    }

    const draft = this.moveHistory.toReplayAction(entry);
    await this.replayService.recordAction(replayId, {
      actionType: draft.actionType,
      timestamp: draft.timestamp,
      actionData: draft.actionData,
      stateBefore: draft.stateBefore,
      stateAfter: draft.stateAfter,
      metadata: draft.metadata,
    });
  }
}
