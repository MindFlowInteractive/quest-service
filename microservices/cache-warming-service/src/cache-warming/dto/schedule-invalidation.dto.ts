import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ScheduleInvalidationDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keys?: string[];

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  delaySeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  repeatIntervalSeconds?: number;
}
