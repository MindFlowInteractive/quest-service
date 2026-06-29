import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { ProgressType } from '../entities/player-progress.entity';

export class TrackProgressDto {
  @IsEnum(ProgressType)
  type: ProgressType;

  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}