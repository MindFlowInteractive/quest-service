import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { TemplateCategory } from '../entities/email-template.entity';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  subject: string;

  @IsString()
  htmlBody: string;

  @IsString()
  @IsOptional()
  textBody?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsObject()
  @IsOptional()
  defaultVariables?: Record<string, any>;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  htmlBody?: string;

  @IsString()
  @IsOptional()
  textBody?: string;

  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @IsObject()
  @IsOptional()
  defaultVariables?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  previewText?: string;

  @IsString()
  @IsOptional()
  fromEmail?: string;

  @IsString()
  @IsOptional()
  fromName?: string;

  @IsString()
  @IsOptional()
  replyTo?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RenderTemplateDto {
  @IsString()
  templateName: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>;
}
