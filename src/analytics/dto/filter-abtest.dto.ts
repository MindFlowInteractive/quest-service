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