import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsObject, IsArray, Min, Max } from 'class-validator';

export class CreatePuzzleDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';

  @IsObject()
  @IsNotEmpty()
  content: {
    type: 'multiple-choice' | 'fill-blank' | 'true-false' | 'code' | 'visual';
    options?: string[];
    correctAnswer: any;
    explanation?: string;
    media?: {
      images?: string[];
      videos?: string[];
    };
  };

  @IsInt()
  @Min(0)
  @IsOptional()
  rewardPoints?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxAttempts?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
