import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReportStatus } from '../entities/content-report.entity';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsString()
  @IsOptional()
  resolution?: string;
}
