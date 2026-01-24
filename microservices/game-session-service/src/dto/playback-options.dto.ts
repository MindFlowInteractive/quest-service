import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class PlaybackOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  speed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startFrom?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  endAt?: number;
}
