import { IsEnum, IsOptional, IsString } from 'class-validator';


export enum ExportFormat { CSV = 'csv', JSON = 'json' }


export class CreateExportJobDto {
    @IsString()
    queryName: string; // e.g. 'puzzles_summary'

    @IsString()
    type: string;


    @IsOptional()
    @IsString()
    tenantId?: string;


    @IsOptional()
    @IsEnum(ExportFormat)
    format?: ExportFormat = ExportFormat.CSV;
}