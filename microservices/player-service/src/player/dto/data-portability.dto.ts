import { IsEnum, IsObject } from 'class-validator';
import { ExportCadence, ExportFormat } from '../data-portability.types';

export class ExportRequestDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;
}

export class CreateExportScheduleDto {
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsEnum(ExportCadence)
  cadence: ExportCadence;
}

export class ValidateImportDto {
  @IsObject()
  data: Record<string, unknown>;
}
