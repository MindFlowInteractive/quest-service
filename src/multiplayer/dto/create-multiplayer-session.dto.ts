import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { RoomType } from '../../multiplayer/interfaces/multiplayer.interface';

export class CreateMultiplayerSessionDto {
  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsNumber()
  skillLevel: number;

  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsNumber()
  maxPlayers?: number;

  @IsOptional()
  @IsNumber()
  minPlayers?: number;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsBoolean()
  spectatingAllowed?: boolean;

  @IsOptional()
  @IsString()
  puzzleId?: string;

  @IsOptional()
  settings?: Record<string, any>;
}
