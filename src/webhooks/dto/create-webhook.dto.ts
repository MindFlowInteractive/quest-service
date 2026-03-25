import { IsUrl, IsArray, IsString, ArrayNotEmpty, IsOptional } from 'class-validator';
import { WebhookEvent } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @IsUrl({}, { message: 'URL must be a valid HTTPS URL' })
  url: string;

  @IsString()
  secret: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: WebhookEvent[];

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  appId?: string;
}