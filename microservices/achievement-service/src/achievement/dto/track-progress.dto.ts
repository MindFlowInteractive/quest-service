import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class TrackProgressDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  metricKey: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  context?: Record<string, unknown>;
}
