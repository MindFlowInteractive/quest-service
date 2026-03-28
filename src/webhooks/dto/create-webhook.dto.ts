import {
  IsUrl,
  IsArray,
  IsString,
  ArrayNotEmpty,
  IsOptional,
  IsIn,
  MinLength,
} from 'class-validator';
import { SUPPORTED_WEBHOOK_EVENTS, WebhookEvent } from '../webhook.constants';

export class CreateWebhookDto {
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'URL must be a valid HTTPS URL' })
  url: string;

  @IsString()
  @MinLength(1)
  secret: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(SUPPORTED_WEBHOOK_EVENTS, { each: true })
  events: WebhookEvent[];

  @IsOptional()
  @IsString()
  appId?: string;
}