import {
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateExperimentDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants: VariantDto[];

  @IsInt()
  @Min(1)
  @Max(100)
  traffic_split_pct: number;
}