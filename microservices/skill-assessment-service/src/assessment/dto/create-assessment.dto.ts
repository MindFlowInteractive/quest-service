import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssessmentType } from '../entities/assessment.entity';

export class CreateAssessmentDto {
  @IsUUID()
  playerId: string;

  @IsEnum(AssessmentType)
  @IsOptional()
  type?: AssessmentType;
}
