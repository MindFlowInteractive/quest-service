import { IsString, IsNumber, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ActionType } from '../entities/action.entity';

export class RecordActionDto {
  @IsString()
  type: ActionType;

  @IsObject()
  payload: Record<string, any>;

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class RecordActionsDto {
  @IsObject({ each: true })
  actions: Array<{
    type: ActionType;
    payload: Record<string, any>;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
}

export class CreateReplayDto {
  @IsNumber()
  puzzleId: number;

  @IsNumber()
  playerId: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['private', 'shared', 'public', 'unlisted'])
  privacyLevel?: string;

  @IsObject()
  initialState: any;
}

export class PlaybackOptionsDto {
  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  startPosition?: number;

  @IsOptional()
  @IsNumber()
  endPosition?: number;
}

export class ShareReplayDto {
  @IsNumber({}, { each: true })
  userIds: number[];
}

export class UpdatePrivacyDto {
  @IsEnum(['private', 'shared', 'public', 'unlisted'])
  privacyLevel: string;
}
