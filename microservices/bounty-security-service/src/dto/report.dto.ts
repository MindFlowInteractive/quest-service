import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DisclosureType,
  ReportStatus,
  SeverityTier,
} from '../entities/report-status.enum';

// ── Submission ────────────────────────────────────────────────────────────

export class SubmitReportDto {
  @ApiProperty({ description: 'Researcher UUID submitting the report' })
  @IsUUID()
  researcherId: string;

  @ApiProperty({ description: 'Unique slug of the bounty program (or omit for general)' })
  @IsOptional()
  @IsString()
  bountySlug?: string;

  @ApiProperty()
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stepsToReproduce: string;

  @ApiProperty({ example: 'auth-service' })
  @IsString()
  @IsNotEmpty()
  affectedComponent: string;

  @ApiProperty({ enum: SeverityTier })
  @IsEnum(SeverityTier)
  severity: SeverityTier;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 7.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cvssScore?: number;

  @ApiPropertyOptional({ example: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' })
  @IsOptional()
  @IsString()
  cvssVector?: string;

  @ApiPropertyOptional({ enum: DisclosureType, default: DisclosureType.PRIVATE })
  @IsOptional()
  @IsEnum(DisclosureType)
  disclosure?: DisclosureType;

  @ApiPropertyOptional({ type: 'array', example: [{ name: 'poc.png', url: 's3://...' }] })
  @IsOptional()
  attachments?: Array<{ name: string; url: string; size?: number }>;
}

// ── Workflow transitions ─────────────────────────────────────────────────

export class TransitionReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  toStatus: ReportStatus;

  @ApiProperty({ description: 'Username or UUID of the operator performing the transition' })
  @IsString()
  @IsNotEmpty()
  actor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    enum: SeverityTier,
    description: 'Override assessed severity during triage',
  })
  @IsOptional()
  @IsEnum(SeverityTier)
  severityOverride?: SeverityTier;
}

// ── Listing ──────────────────────────────────────────────────────────────

export class ListReportsFilterDto {
  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: SeverityTier })
  @IsOptional()
  @IsEnum(SeverityTier)
  severity?: SeverityTier;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  researcherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bountyId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  limit?: number;
}
