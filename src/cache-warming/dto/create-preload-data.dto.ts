import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { PreloadSourceType, WarmWindow } from '../entities/preload-data.entity';

export class CreatePreloadDataDto {
  @IsString()
  cacheKey: string;

  @IsOptional()
  @IsEnum(PreloadSourceType)
  sourceType?: PreloadSourceType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsUrl({ require_tld: false })
  fetchUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  ttlSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(WarmWindow)
  warmWindow?: WarmWindow;

  @IsOptional()
  @IsInt()
  @Min(60)
  invalidationIntervalSeconds?: number;
}
