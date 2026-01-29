import { IsUUID, IsString, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(2)
  @Max(100)
  maxPlayers: number;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsUUID()
  puzzleId?: string;
}

export class JoinRoomDto {
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxPlayers?: number;
}

export class RoomResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  status: string;
  participants: string[];
  maxPlayers: number;
  isPrivate: boolean;
  puzzleId: string;
  createdAt: Date;
  updatedAt: Date;
}
