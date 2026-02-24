import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ProfileStatisticsDto {
  @IsOptional()
  @IsNumber()
  totalGamesPlayed?: number;

  @IsOptional()
  @IsNumber()
  totalWins?: number;

  @IsOptional()
  @IsNumber()
  winRate?: number;

  @IsOptional()
  @IsNumber()
  averageScore?: number;

  @IsOptional()
  @IsNumber()
  bestScore?: number;

  @IsOptional()
  @IsNumber()
  totalPlayTime?: number;

  @IsOptional()
  @IsString()
  favoriteCategory?: string;

  @IsOptional()
  @IsNumber()
  currentStreak?: number;

  @IsOptional()
  @IsNumber()
  longestStreak?: number;

  @IsOptional()
  @IsNumber()
  totalPuzzlesSolved?: number;

  @IsOptional()
  @IsNumber()
  averageCompletionTime?: number;

  @IsOptional()
  @IsNumber()
  perfectScores?: number;

  @IsOptional()
  @IsNumber()
  hintsUsed?: number;
}