import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScoreConflictStatus } from '../entities/score-conflict.entity';

export class RunReconciliationDto {
  /** How far back to look, in hours. Defaults to the configured lookback. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24 * 90)
  lookbackHours?: number;
}

export class ListReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ListConflictsQueryDto {
  @IsOptional()
  @IsEnum(ScoreConflictStatus)
  status?: ScoreConflictStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class ResolveConflictDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  resolution: string;
}
