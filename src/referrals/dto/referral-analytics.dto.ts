import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';

export enum ReferralAnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL_TIME = 'all_time',
}

export class ReferralAnalyticsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(ReferralAnalyticsPeriod)
  period?: ReferralAnalyticsPeriod;

  @IsOptional()
  @IsString()
  userId?: string;
}
