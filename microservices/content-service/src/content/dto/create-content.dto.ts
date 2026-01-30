import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ContentType } from '../../entities/content.entity.js';

export class CreateContentDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
