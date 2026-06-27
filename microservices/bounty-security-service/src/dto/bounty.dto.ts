import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BountyStatus,
  SeverityTier,
} from '../entities/report-status.enum';

export class RewardTierDto {
  @ApiProperty({ enum: SeverityTier })
  @IsEnum(SeverityTier)
  severity: SeverityTier;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  minAmount: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  maxAmount: number;

  @ApiProperty({ example: 'USD', default: 'USD' })
  @IsString()
  currency: string;
}

export class CreateBountyDto {
  @ApiProperty({ example: 'main-app-q3-2026' })
  @IsString()
  @Length(3, 100)
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: [{ type: 'wildcard', target: 'api.example.com' }] })
  @IsOptional()
  @IsArray()
  scope?: Array<{ type: string; target: string }>;

  @ApiPropertyOptional({ example: ['example.com/login (no auth bypass)', 'social media'] })
  @IsOptional()
  @IsArray()
  outOfScope?: string[];

  @ApiPropertyOptional({ type: [RewardTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardTierDto)
  tiers?: RewardTierDto[];

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: BountyStatus, default: BountyStatus.DRAFT })
  @IsOptional()
  @IsEnum(BountyStatus)
  status?: BountyStatus;

  @ApiPropertyOptional({ description: 'Total budget pool (null = uncapped)' })
  @IsOptional()
  budgetCap?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @ApiPropertyOptional()
  @IsOptional()
  opensAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  closesAt?: Date;
}

export class UpdateBountyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  scope?: Array<{ type: string; target: string }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  outOfScope?: string[];

  @ApiPropertyOptional({ type: [RewardTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RewardTierDto)
  tiers?: RewardTierDto[];

  @ApiPropertyOptional({ enum: BountyStatus })
  @IsOptional()
  @IsEnum(BountyStatus)
  status?: BountyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  budgetCap?: number;

  @ApiPropertyOptional()
  @IsOptional()
  closesAt?: Date;
}
