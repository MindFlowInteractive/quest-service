import { IsUUID, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateBookmarkDto {
  @IsUUID()
  puzzleId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsString({ each: true })
  tagNames?: string[];
}
