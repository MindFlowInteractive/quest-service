import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsEmail,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailPriority, EmailType } from '../entities/email.entity';

class AttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  content: string;

  @IsString()
  contentType: string;
}

export class SendEmailDto {
  @IsEmail()
  toEmail: string;

  @IsString()
  @IsOptional()
  toName?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  subject: string;

  @IsString()
  htmlContent: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsEnum(EmailPriority)
  @IsOptional()
  priority?: EmailPriority;

  @IsEnum(EmailType)
  @IsOptional()
  type?: EmailType;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class SendTemplatedEmailDto {
  @IsEmail()
  toEmail: string;

  @IsString()
  @IsOptional()
  toName?: string;

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
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsEnum(EmailPriority)
  @IsOptional()
  priority?: EmailPriority;

  @IsEnum(EmailType)
  @IsOptional()
  type?: EmailType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}

export class SendBatchEmailDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailDto)
  emails: SendEmailDto[];
}
