import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PuzzleImportFormat {
  JSON = 'json',
  CSV = 'csv',
  YAML = 'yaml',
}

export class BulkImportPuzzlesDto {
  @IsOptional()
  @IsEnum(PuzzleImportFormat)
  format?: PuzzleImportFormat = PuzzleImportFormat.JSON;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  dryRun?: boolean = false;

  @IsOptional()
  @IsString()
  fileContent?: string;

  @IsOptional()
  data?: any;
}

export interface PuzzleImportRowError {
  row: number;
  title?: string;
  errors: string[];
}

export interface PuzzleBulkImportReport {
  dryRun: boolean;
  filename: string;
  totalRecords: number;
  validCount: number;
  invalidCount: number;
  status: 'success' | 'failed' | 'partial';
  errors: PuzzleImportRowError[];
  importedPuzzles?: Array<{ id: string; title: string }>;
  importHistoryId?: string;
}
