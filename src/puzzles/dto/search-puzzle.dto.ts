import { IsOptional, IsString, IsEnum, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PuzzleDifficulty } from './create-puzzle.dto';

export enum SortBy {
  CREATED_AT = 'createdAt',
  TITLE = 'title',
  DIFFICULTY = 'difficulty',
  RATING = 'rating',
  PLAYS = 'totalPlays',
  COMPLETION_RATE = 'completionRate'
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC'
}

export class SearchPuzzleDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(PuzzleDifficulty)
  difficulty?: PuzzleDifficulty;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxRating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: any) => typeof value === 'string' ? value.split(',') : value)
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: any) => value === 'true')
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: any) => value === 'true')
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class PuzzleStatsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: any) => value === 'true')
  includeStats?: boolean = false;

  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'year' | 'all' = 'all';
}
