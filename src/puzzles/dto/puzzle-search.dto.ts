import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
// import { ApiPropertyOptional } from '@nestjs/swagger';
import { PuzzleDifficulty } from './create-puzzle.dto';

export enum PuzzleSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
  DIFFICULTY = 'difficultyRating',
  RATING = 'averageRating',
  ATTEMPTS = 'attempts',
  COMPLETIONS = 'completions',
  POPULARITY = 'popularity',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PuzzleSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PuzzleDifficulty, { each: true })
  difficulty?: PuzzleDifficulty[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  minDifficultyRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxDifficultyRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsEnum(PuzzleSortBy)
  sortBy?: PuzzleSortBy = PuzzleSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PuzzleFilterDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(PuzzleDifficulty, { each: true })
  difficulties?: PuzzleDifficulty[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAttempts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minAverageRating?: number;

  @IsOptional()
  @IsBoolean()
  hasPrerequisites?: boolean;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
