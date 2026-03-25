import { IsUUID, IsEnum, IsObject, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PlayerActionEventType } from '../entities/player-action-event.entity';

export class CreatePlayerActionEventDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsEnum(['puzzle.started', 'puzzle.solved', 'puzzle.abandoned', 'hint.used', 'answer.submitted', 'achievement.unlocked'])
  eventType: PlayerActionEventType;

  @IsObject()
  payload: Record<string, any>;
}

export class PagedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
