import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConflictResolution } from '../interfaces/save-game.interfaces';
import { SaveGameDataDto } from './create-save-game.dto';

export class SyncSaveGameDto {
  @IsNumber()
  slotId: number;

  @IsOptional()
  @IsString()
  localChecksum?: string;

  @IsOptional()
  lastModifiedAt?: Date;

  @IsOptional()
  @IsNumber()
  saveVersion?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveGameDataDto)
  localData?: SaveGameDataDto;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  platform?: string;
}

export class ResolveConflictDto {
  @IsUUID()
  saveId: string;

  @IsEnum(ConflictResolution)
  resolution: ConflictResolution;

  @IsOptional()
  @ValidateNested()
  @Type(() => SaveGameDataDto)
  mergedData?: SaveGameDataDto;
}

export class BatchSyncDto {
  @ValidateNested({ each: true })
  @Type(() => SyncSaveGameDto)
  saves: SyncSaveGameDto[];

  @IsOptional()
  @IsBoolean()
  forceCloud?: boolean;

  @IsOptional()
  @IsString()
  deviceId?: string;
}
