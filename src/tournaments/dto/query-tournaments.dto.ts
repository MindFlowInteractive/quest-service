import {
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class QueryTournamentsDto {
  @IsOptional()
  @IsEnum([
    'scheduled',
    'registration',
    'in-progress',
    'completed',
    'cancelled',
  ])
  status?:
    | 'scheduled'
    | 'registration'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

  @IsOptional()
  @IsEnum(['single-elimination', 'double-elimination', 'round-robin', 'swiss'])
  bracketType?:
    | 'single-elimination'
    | 'double-elimination'
    | 'round-robin'
    | 'swiss';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['startTime', 'createdAt', 'prizePool', 'participants'])
  sortBy?: 'startTime' | 'createdAt' | 'prizePool' | 'participants';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
