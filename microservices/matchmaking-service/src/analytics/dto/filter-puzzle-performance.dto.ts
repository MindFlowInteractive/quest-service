import { IsOptional, IsString, IsUUID, IsDateString, IsEnum } from 'class-validator';

export enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export class FilterPuzzlePerformanceDto {
  @IsOptional()
  @IsUUID()
  puzzleId?: string;

  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}