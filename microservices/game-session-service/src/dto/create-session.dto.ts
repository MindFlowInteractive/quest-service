import { IsString, IsOptional, IsObject, IsNumber, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  puzzleId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(60) // Minimum 60 seconds
  timeoutAfter?: number; // seconds
}
