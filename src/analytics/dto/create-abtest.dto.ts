export class CreateABTestDto {
  @IsString()
  testName: string;

  @IsArray()
  @IsString({ each: true })
  variants: string[];

  @IsString()
  metricName: string;

  @IsOptional()
  @IsString()
  description?: string;
}