import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExperimentStatus } from '../interfaces/user-signal.interface';

export class ExperimentVariantDto {
  @IsString()
  @Length(1, 60)
  @Matches(/^[a-z0-9][a-z0-9-_]*$/, {
    message: 'variant key must be lowercase alphanumeric with - or _',
  })
  key: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  label?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateExperimentDto {
  @IsString()
  @Length(3, 60)
  @Matches(/^[a-z0-9][a-z0-9-_]*$/, {
    message:
      'key must be lowercase alphanumeric with optional - or _, starting with alphanumeric',
  })
  key: string;

  @IsString()
  @Length(3, 200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsEnum(ExperimentStatus)
  status?: ExperimentStatus;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ExperimentVariantDto)
  variants: ExperimentVariantDto[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class AssignExperimentDto {
  @IsString()
  @Length(1, 120)
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  trafficSplit?: number;
}
