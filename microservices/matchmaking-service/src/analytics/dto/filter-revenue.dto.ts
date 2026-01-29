import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterRevenueDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  revenueType?: string; // iap, subscription, ad_revenue
}
