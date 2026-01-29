import { IsUUID, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateLeaderboardEntryDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  seasonId?: string;
}

export class UpdateLeaderboardScoreDto {
  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0)
  wins: number;

  @IsNumber()
  @Min(0)
  losses: number;
}

export class LeaderboardResponseDto {
  id: string;
  userId: string;
  seasonId: string;
  score: number;
  rank: number;
  wins: number;
  losses: number;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}
