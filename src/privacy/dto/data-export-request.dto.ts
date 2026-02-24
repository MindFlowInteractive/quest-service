import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ExportFormat, ExportScope } from '../entities/data-export-request.entity';

export class DataExportRequestDto {
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.JSON;

  @IsEnum(ExportScope)
  @IsOptional()
  scope?: ExportScope = ExportScope.FULL;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customEntities?: string[];
}
