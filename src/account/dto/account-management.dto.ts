import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResetType } from '../entities/account-reset.entity';

export class RequestResetDto {
  @ApiProperty({ enum: ResetType, description: 'Type of progression reset' })
  @IsEnum(ResetType)
  resetType: ResetType;

  @ApiPropertyOptional({ description: 'Optional reason for the reset' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConfirmResetDto {
  @ApiProperty({ description: 'Confirmation token received after reset request' })
  @IsString()
  confirmationToken: string;
}

export class LinkAccountDto {
  @ApiProperty({ description: 'Provider name (e.g. "google", "discord")' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'External account identifier from the provider' })
  @IsString()
  externalId: string;
}
