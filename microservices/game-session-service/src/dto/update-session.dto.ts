import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { SessionStatus } from '../entities/session.entity';

export class UpdateSessionDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @IsOptional()
  @IsString()
  puzzleId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalMoves?: number;

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
