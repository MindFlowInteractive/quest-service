import { IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { SmsReceiptStatus } from '../entities/sms-receipt.entity';

export class ConfirmReceiptDto {
  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  providerMessageId?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsEnum(SmsReceiptStatus)
  status: SmsReceiptStatus;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, any>;
}
