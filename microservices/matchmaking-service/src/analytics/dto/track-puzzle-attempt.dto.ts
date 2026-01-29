import { IsUUID, IsString, IsEnum, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { PuzzleDifficulty } from './filter-puzzle-performance.dto';

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