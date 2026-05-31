import { IsEnum, IsNumber, IsArray, IsString, IsOptional, IsBoolean } from 'class-validator';
import { TestCategory, TestDifficulty } from '../entities/test.entity';

export class CreateTestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(TestCategory)
  category: TestCategory;

  @IsEnum(TestDifficulty)
  @IsOptional()
  difficulty?: TestDifficulty;

  @IsNumber()
  timeLimit: number;

  @IsNumber()
  @IsOptional()
  minScore?: number;

  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @IsArray()
  questions: Array<{
    id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>;

  @IsOptional()
  metadata?: Record<string, any>;
}
