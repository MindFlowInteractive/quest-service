import { IsEnum, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ContentType } from '../enums/moderation.enums';

export class AnalyzeContentDto {
  @IsEnum(ContentType)
  contentType: ContentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
