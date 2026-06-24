import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MessagePriority,
  MessageStatus,
  MessageType,
} from '../entities/message.entity';

export class SendSmsDto {
  @IsPhoneNumber()
  toPhoneNumber: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  fromNumber?: string;

  @IsString()
  @MaxLength(1600)
  body: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class SendTemplatedSmsDto {
  @IsPhoneNumber()
  toPhoneNumber: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  templateName: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;

  @IsString()
  @IsOptional()
  fromNumber?: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class GenerateOtpDto {
  @IsPhoneNumber()
  toPhoneNumber: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  templateName?: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;
}

export class VerifyOtpDto {
  @IsPhoneNumber()
  toPhoneNumber: string;

  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}

export class DeliveryReceiptDto {
  @IsString()
  providerMessageId: string;

  @IsEnum(MessageStatus)
  status: MessageStatus;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsString()
  @IsOptional()
  errorCode?: string;

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsObject()
  @IsOptional()
  rawPayload?: Record<string, any>;
}
