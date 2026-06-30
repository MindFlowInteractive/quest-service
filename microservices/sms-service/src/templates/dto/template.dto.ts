import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSmsTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateSmsTemplateDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  variables?: string[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RenderSmsTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsObject()
  variables: Record<string, any>;
}
