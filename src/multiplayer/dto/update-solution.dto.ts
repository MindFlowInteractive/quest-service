import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdatePartialSolutionDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  stepId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  confidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  clientVersion?: number;
}
