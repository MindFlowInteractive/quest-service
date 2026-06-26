import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  SegmentStatus,
  SegmentationType,
} from '../interfaces/user-signal.interface';

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsEnum(SegmentationType)
  type?: SegmentationType;

  @IsOptional()
  @IsEnum(SegmentStatus)
  status?: SegmentStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  evaluationIntervalSeconds?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
