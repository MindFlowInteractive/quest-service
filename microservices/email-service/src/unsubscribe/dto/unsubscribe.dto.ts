import { IsString, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { EmailCategory, UnsubscribeReason } from '../entities/email-unsubscribe.entity';

export class CreateUnsubscribeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(EmailCategory)
  @IsOptional()
  category?: EmailCategory;

  @IsEnum(UnsubscribeReason)
  @IsOptional()
  reason?: UnsubscribeReason;
}

export class UnsubscribeByTokenDto {
  @IsString()
  token: string;

  @IsEnum(EmailCategory)
  @IsOptional()
  category?: EmailCategory;
}

export class ResubscribeDto {
  @IsEmail()
  email: string;

  @IsEnum(EmailCategory)
  @IsOptional()
  category?: EmailCategory;
}
