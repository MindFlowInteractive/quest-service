import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
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

  @IsOptional()
  @IsString()
  evidence?: string;
}

export class CreatePlayerReportDto {
  @IsString()
  @IsNotEmpty()
  reportedPlayerId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  evidence?: string;
}
