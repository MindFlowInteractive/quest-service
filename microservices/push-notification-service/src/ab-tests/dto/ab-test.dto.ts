import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ABTestVariantDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreateABTestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => ABTestVariantDto)
  variantA: ABTestVariantDto;

  @ValidateNested()
  @Type(() => ABTestVariantDto)
  variantB: ABTestVariantDto;

  @IsNumber()
  @Min(1)
  @Max(99)
  @IsOptional()
  splitPercentage?: number;

  @IsString()
  @IsOptional()
  segmentId?: string;
}

export class CompleteABTestDto {
  @IsString()
  @IsNotEmpty()
  winnerId: string;
}
