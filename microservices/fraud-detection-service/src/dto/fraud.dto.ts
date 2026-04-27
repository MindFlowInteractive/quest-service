import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus } from '../entities/fraud-alert.entity';
import { ReviewStatus } from '../entities/review-queue.entity';
import { RuleAction, RuleConditionOperator } from '../entities/fraud-rule.entity';

// ── Alert DTOs ──────────────────────────────────────────────────────────────

export class UpdateAlertDto {
  @ApiPropertyOptional({ enum: AlertStatus })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

// ── Review Queue DTOs ────────────────────────────────────────────────────────

export class AssignReviewDto {
  @ApiProperty({ description: 'Reviewer UUID' })
  @IsUUID()
  reviewerId: string;
}

export class CompleteReviewDto {
  @ApiProperty({ description: 'Outcome: clean | action_taken | escalate' })
  @IsString()
  @IsNotEmpty()
  outcome: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ── Rule DTOs ────────────────────────────────────────────────────────────────

export class CreateRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  metric: string;

  @ApiProperty({ enum: RuleConditionOperator })
  @IsEnum(RuleConditionOperator)
  operator: RuleConditionOperator;

  @ApiProperty()
  threshold: number;

  @ApiProperty({ enum: RuleAction })
  @IsEnum(RuleAction)
  action: RuleAction;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  riskPoints?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  priority?: number;
}

// ── Account Flag DTOs ────────────────────────────────────────────────────────

export class SuspendAccountDto {
  @ApiProperty({ description: 'Reason for suspension' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Suspension duration in hours (omit for permanent)' })
  @IsOptional()
  durationHours?: number;
}
