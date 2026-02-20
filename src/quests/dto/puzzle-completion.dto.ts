import { IsUUID, IsInt, IsBoolean, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CompletionMetadataDto {
  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsOptional()
  puzzleType?: string;

  @IsInt()
  @IsOptional()
  movesUsed?: number;

  @IsString()
  @IsOptional()
  completionMethod?: string;
}

export class PuzzleCompletionDto {
  @IsInt()
  score: number;

  @IsInt()
  timeTaken: number; // seconds

  @IsInt()
  hintsUsed: number;

  @IsBoolean()
  @IsOptional()
  completedSuccessfully?: boolean;

  @ValidateNested()
  @Type(() => CompletionMetadataDto)
  @IsOptional()
  metadata?: CompletionMetadataDto;
}