import { IsOptional, IsString } from 'class-validator';

/**
 * Body for an undo or redo request.
 *
 * The session mode and the puzzle type are fixed when the puzzle is created,
 * so they are deliberately not accepted here — otherwise a client could
 * downgrade a ranked session to dodge the undo restrictions.
 */
export class UndoRedoDto {
  /**
   * Optional replay to mirror the undo/redo action onto, so the replay shows
   * exactly what the player did.
   */
  @IsOptional()
  @IsString()
  replayId?: string;
}

/** Query parameters for reading a session's move history. */
export class MoveHistoryQueryDto {
  /**
   * Set to `true` to include the replay actions derived from the history, so
   * they can be imported straight into the replay system.
   */
  @IsOptional()
  @IsString()
  includeReplayActions?: string;
}
