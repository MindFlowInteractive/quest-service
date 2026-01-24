import {
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { SnapshotType } from '../entities/state.entity';

export class CreateSnapshotDto {
  @IsString()
  sessionId: string;

  @IsObject()
  state: Record<string, any>;

  @IsOptional()
  @IsEnum(SnapshotType)
  snapshotType?: SnapshotType;

  @IsOptional()
  @IsString()
  checkpointName?: string;

  @IsOptional()
  @IsBoolean()
  isRestorePoint?: boolean;
}
