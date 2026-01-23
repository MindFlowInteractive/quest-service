import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaveType, SaveGameData } from '../interfaces/save-game.interfaces';

export class PlayerStateDto {
  @IsOptional()
  @IsObject()
  position?: { x: number; y: number; z?: number };

  @IsOptional()
  @IsNumber()
  health?: number;

  @IsOptional()
  inventory?: unknown[];

  @IsOptional()
  @IsObject()
  stats?: Record<string, number>;

  // Allow additional properties for extensibility
  [key: string]: unknown;
}

export class ProgressStateDto {
  @IsOptional()
  @IsString({ each: true })
  completedLevels?: string[];

  @IsOptional()
  @IsString({ each: true })
  unlockedAchievements?: string[];

  @IsOptional()
  @IsString({ each: true })
  collectibles?: string[];

  // Allow additional properties for extensibility
  [key: string]: unknown;
}

export class SaveGameDataDto implements Partial<SaveGameData> {
  @IsNumber()
  @Min(1)
  version: number;

  @IsObject()
  gameState: Record<string, unknown>;

  @ValidateNested()
  @Type(() => PlayerStateDto)
  playerState: PlayerStateDto;

  @ValidateNested()
  @Type(() => ProgressStateDto)
  progressState: ProgressStateDto;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class CreateSaveGameDto {
  @IsNumber()
  @Min(0)
  @Max(99)
  slotId: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slotName?: string;

  @IsOptional()
  @IsEnum(SaveType)
  saveType?: SaveType;

  @ValidateNested()
  @Type(() => SaveGameDataDto)
  data: SaveGameDataDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  playtime?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  platform?: string;

  @IsOptional()
  @IsObject()
  customMetadata?: Record<string, unknown>;
}
