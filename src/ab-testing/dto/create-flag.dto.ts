import {
  IsString,
  IsBoolean,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { TargetCohort } from '../entities/feature-flag.entity';

export class CreateFlagDto {
  @IsString()
  key: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rollout_pct?: number;

  @IsOptional()
  @IsEnum(TargetCohort)
  target_cohort?: TargetCohort;
}