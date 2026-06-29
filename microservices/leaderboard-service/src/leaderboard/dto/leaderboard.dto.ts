import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { LeaderboardCategory, TimePeriod } from '../entities/leaderboard.entity';

export class GetLeaderboardQueryDto {
  @IsEnum(LeaderboardCategory)
  @IsOptional()
  category?: LeaderboardCategory;

  @IsEnum(TimePeriod)
  @IsOptional()
  timePeriod?: TimePeriod;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}

export class UpdateScoreDto {
  @IsString()
  playerId: string;

  @IsEnum(LeaderboardCategory)
  category: LeaderboardCategory;

  @IsInt()
  @Min(0)
  score: number;
}

export class GetPlayerRankDto {
  @IsString()
  playerId: string;

  @IsEnum(LeaderboardCategory)
  @IsOptional()
  category?: LeaderboardCategory;

  @IsEnum(TimePeriod)
  @IsOptional()
  timePeriod?: TimePeriod;
}