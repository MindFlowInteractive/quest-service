import { IsUUID, IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetRecommendationsDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';

  @IsOptional()
  @IsEnum(['collaborative', 'content-based', 'hybrid', 'popular'])
  algorithm?: 'collaborative' | 'content-based' | 'hybrid' | 'popular';

  @IsOptional()
  @IsString()
  abTestGroup?: string;
}

export class RecommendationResponseDto {
  id: string;
  puzzleId: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  difficultyRating: number;
  averageRating: number;
  completions: number;
  tags: string[];
  score: number;
  reason: string;
  algorithm: string;
  metadata?: any;
}

export class TrackInteractionDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  puzzleId: string;

  @IsEnum(['view', 'click', 'start', 'complete', 'abandon', 'rate', 'share'])
  interactionType: 'view' | 'click' | 'start' | 'complete' | 'abandon' | 'rate' | 'share';

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  metadata?: any;
}