import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterABTestDto {
  @IsOptional()
  @IsString()
  testId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}