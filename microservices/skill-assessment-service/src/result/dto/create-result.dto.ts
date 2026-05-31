import { IsNumber, IsArray, IsUUID } from 'class-validator';

export class CreateResultDto {
  @IsUUID()
  assessmentId: string;

  @IsUUID()
  testId: string;

  @IsNumber()
  score: number;

  @IsNumber()
  timeTaken: number;

  @IsNumber()
  questionsAnswered: number;

  @IsNumber()
  correctAnswers: number;

  @IsArray()
  answers: Array<{
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }>;

  performanceMetrics?: Record<string, number>;
}
