import { IsEnum, IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';
import { ContentType, ViolationCategory } from '../enums/moderation.enums';

export class FlagContentDto {
  @IsEnum(ContentType)
  contentType: ContentType;

  @IsUUID()
  contentId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  contentSnapshot?: string;

  @IsOptional()
  @IsEnum(ViolationCategory)
  category?: ViolationCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  flagReason?: string;
}
