import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ConfigKind } from '../entities';

export class CreateEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpsertConfigDto {
  @IsNotEmpty()
  value: unknown;

  @IsOptional()
  @IsEnum(ConfigKind)
  kind?: ConfigKind;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpsertSecretDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class RegisterWebhookDto {
  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  environment: string;

  @IsUrl({ require_tld: false })
  url: string;

  @IsOptional()
  @IsString()
  signingSecret?: string;
}

export class SetWebhookStateDto {
  @IsBoolean()
  active: boolean;
}

export class RollbackDto {
  @IsString()
  @IsNotEmpty()
  actor: string;
}
