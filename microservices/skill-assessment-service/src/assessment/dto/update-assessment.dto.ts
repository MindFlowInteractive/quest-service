import { IsEnum, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { AssessmentStatus } from '../entities/assessment.entity';

export class UpdateAssessmentDto {
  @IsEnum(AssessmentStatus)
  @IsOptional()
  status?: AssessmentStatus;

  @IsNumber()
  @IsOptional()
  difficultyLevel?: number;

  @IsNumber()
  @IsOptional()
  questionsAnswered?: number;

  @IsNumber()
  @IsOptional()
  correctAnswers?: number;
}
