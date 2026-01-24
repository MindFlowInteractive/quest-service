import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaveGameDataDto } from './create-save-game.dto';

export class UpdateSaveGameDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slotName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveGameDataDto)
  data?: SaveGameDataDto;

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
