import { IsString, IsNumber, IsArray, ValidateNested, IsObject, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantResultDto {
  @IsString()
  variant: string;

  @IsNumber()
  total_users: number;

  @IsNumber()
  conversions: number;

  @IsNumber()
  conversion_rate: number;
}

export class SignificanceResultDto {
  @IsNumber()
  z_score: number;

  @IsBoolean()
  significant: boolean;
}

export class ExperimentResultsDto {
  @IsString()
  experiment_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantResultDto)
  results: VariantResultDto[];

  @IsOptional()
  @IsObject()
  significance?: SignificanceResultDto;
}