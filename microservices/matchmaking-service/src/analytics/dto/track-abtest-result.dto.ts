import { IsString, IsNumber } from 'class-validator';

export class TrackABTestResultDto {
  @IsString()
  testId: string;

  @IsString()
  playerId: string;

  @IsString()
  variant: string;

  @IsNumber()
  metricValue: number;

  @IsString()
  metricName: string;
}