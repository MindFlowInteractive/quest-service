import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterEngagementDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  cohort?: string;
}