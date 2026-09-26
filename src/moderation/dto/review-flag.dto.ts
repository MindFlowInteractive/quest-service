import { IsEnum, IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ModerationStatus } from '../enums/moderation.enums';

export class ReviewFlagDto {
  @IsUUID()
  flagId: string;

  @IsEnum(ModerationStatus)
  status: ModerationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNotes?: string;
}
