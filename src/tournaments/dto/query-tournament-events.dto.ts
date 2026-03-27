import { IsOptional, IsEnum, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTournamentEventsDto {
  @IsOptional()
  @IsEnum(['draft', 'upcoming', 'active', 'completed'])
  status?: 'draft' | 'upcoming' | 'active' | 'completed';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['startAt', 'endAt', 'createdAt', 'name'])
  sortBy?: 'startAt' | 'endAt' | 'createdAt' | 'name' = 'startAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}