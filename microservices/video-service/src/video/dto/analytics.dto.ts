import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAnalyticsDto {
  @IsEnum(['view', 'playback_start', 'watch_time'])
  event: 'view' | 'playback_start' | 'watch_time';

  @IsOptional()
  @IsNumber()
  @Min(0)
  watchTimeSeconds?: number;
}
