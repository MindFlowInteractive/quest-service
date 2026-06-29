import { IsEnum, IsOptional, IsArray, IsString, IsNotEmpty } from 'class-validator';
import { DeletionType, DeletionReason } from '../entities/data-deletion-request.entity';

export class DataDeletionRequestDto {
  @IsEnum(DeletionType)
  @IsOptional()
  deletionType?: DeletionType = DeletionType.FULL_ACCOUNT;

  @IsEnum(DeletionReason)
  @IsOptional()
  reason?: DeletionReason = DeletionReason.USER_REQUEST;

  @IsString()
  @IsOptional()
  reasonDetails?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  entitiesToDelete?: string[];

  /**
   * Password confirmation required for GDPR account deletion (DELETE /account).
   */
  @IsString()
  @IsOptional()
  password?: string;
}

export class ConfirmDeletionDto {
  @IsString()
  token: string;
}

export class CancelDeletionDto {
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}

/**
 * DTO for password-only confirmation (used by DELETE /account).
 */
export class ConfirmPasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
