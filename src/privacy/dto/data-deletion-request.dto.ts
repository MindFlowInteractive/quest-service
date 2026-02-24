import { IsEnum, IsOptional, IsArray, IsString, IsIn } from 'class-validator';
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
