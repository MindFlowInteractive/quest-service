import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BulkAction {
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  UPDATE_CATEGORY = 'update_category',
  ADD_TAGS = 'add_tags',
  REMOVE_TAGS = 'remove_tags',
}

export class BulkUpdateDto {
  @IsEnum(BulkAction)
  action: BulkAction;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ExportPuzzleDto {
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' | 'xml' = 'json';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 1000;
}

export class ImportPuzzleDto {
  @IsString()
  format: 'json' | 'csv' | 'xml';

  data: any;

  @IsOptional()
  @IsString()
  importMode?: 'create' | 'update' | 'upsert' = 'create';

  @IsOptional()
  validateOnly?: boolean = false;
}
