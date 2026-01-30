import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ModerationDecision } from '../../entities/moderation-action.entity.js';

export class ApproveSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore?: number;
}

export class RejectSubmissionDto {
  @IsEnum(ModerationDecision)
  decision: ModerationDecision;

  @IsString()
  @MaxLength(2000)
  notes: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flaggedContent?: string[];
}

export class RequestChangesDto {
  @IsString()
  @MaxLength(2000)
  notes: string;

  @IsArray()
  @IsString({ each: true })
  requiredChanges: string[];
}

export class FlagContentDto {
  @IsString()
  @MaxLength(2000)
  reason: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flaggedContent?: string[];
}
