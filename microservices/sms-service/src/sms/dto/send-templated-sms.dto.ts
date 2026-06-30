import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { SmsMessageType, SmsPriority } from '../entities/sms-message.entity';

export class SendTemplatedSmsDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsObject()
  variables: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(SmsMessageType)
  type?: SmsMessageType;

  @IsOptional()
  @IsEnum(SmsPriority)
  priority?: SmsPriority;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
