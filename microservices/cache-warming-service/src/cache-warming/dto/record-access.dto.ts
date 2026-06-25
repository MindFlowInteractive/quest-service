import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PreloadSourceType } from '../entities/preload-data.entity';

export class RecordAccessDto {
  @IsString()
  cacheKey: string;

  @IsBoolean()
  hit: boolean;

  @IsOptional()
  @IsEnum(PreloadSourceType)
  sourceType?: PreloadSourceType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(30)
  ttlSeconds?: number;
}
