import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BoardThemeAssetsDto {
  @IsOptional()
  @IsString()
  boardImageUrl?: string;

  @IsOptional()
  @IsString()
  pieceSetUrl?: string;

  @IsOptional()
  @IsString()
  previewUrl?: string;

  @IsOptional()
  @IsObject()
  colors?: Record<string, string>;
}

export class CreateBoardThemeDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and dashes',
  })
  @MaxLength(64)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unlockHint?: string;

  @ValidateNested()
  @Type(() => BoardThemeAssetsDto)
  assets: BoardThemeAssetsDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateBoardThemeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unlockHint?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BoardThemeAssetsDto)
  assets?: BoardThemeAssetsDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class SelectBoardThemeDto {
  @IsUUID()
  themeId: string;
}

export class GrantBoardThemeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}

/** Theme metadata as served to the frontend. */
export interface BoardThemeView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isFree: boolean;
  unlockHint: string | null;
  assets: Record<string, unknown>;
  assetVersion: number;
  sortOrder: number;
}

/** Theme metadata plus the requesting player's ownership state. */
export interface PlayerBoardThemeView extends BoardThemeView {
  owned: boolean;
  locked: boolean;
  selected: boolean;
}
