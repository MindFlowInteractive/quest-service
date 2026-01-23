export class FilterCustomEventDto {
  @IsOptional()
  @IsString()
  funnelId?: string;

  @IsOptional()
  @IsString()
  eventName?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
