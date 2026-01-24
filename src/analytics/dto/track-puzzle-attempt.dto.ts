export class TrackPuzzleAttemptDto {
  @IsUUID()
  puzzleId: string;

  @IsUUID()
  playerId: string;

  @IsString()
  sessionId: string;

  @IsEnum(PuzzleDifficulty)
  difficulty: PuzzleDifficulty;

  @IsBoolean()
  success: boolean;

  @IsInt()
  timeTaken: number;

  @IsInt()
  movesCount: number;

  @IsOptional()
  @IsInt()
  hintsUsed?: number;

  @IsOptional()
  @IsInt()
  score?: number;
}