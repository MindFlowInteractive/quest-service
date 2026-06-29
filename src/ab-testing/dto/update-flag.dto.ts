import {
  IsBoolean,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { TargetCohort } from '../entities/feature-flag.entity';

export class UpdateFlagDto {
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