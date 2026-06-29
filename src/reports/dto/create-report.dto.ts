import { IsString, IsEnum, IsUUID, IsNotEmpty } from 'class-validator';
import { ReportTargetType } from '../entities/content-report.entity';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
