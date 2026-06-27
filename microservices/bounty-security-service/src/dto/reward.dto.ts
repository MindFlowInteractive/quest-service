import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardStatus } from '../entities/report-status.enum';

export class ApproveRewardDto {
  @ApiProperty({ description: 'Username/UUID of the admin approving the payout' })
  @IsString()
  @IsNotEmpty()
  actor: string;

  @ApiPropertyOptional({ description: 'Override the determined amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayRewardDto {
  @ApiProperty({ description: 'Username/UUID of the admin marking the reward paid' })
  @IsString()
  @IsNotEmpty()
  actor: string;

  @ApiProperty({ description: 'External payment-system reference (transaction id, etc.)' })
  @IsString()
  @IsNotEmpty()
  transactionRef: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRewardStatusDto {
  @ApiProperty({ enum: RewardStatus })
  @IsEnum(RewardStatus)
  status: RewardStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  actor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
