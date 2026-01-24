import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsObject,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { StepProgressStatus } from '../entities/user-tutorial-progress.entity';

export class StartTutorialDto {
  @IsUUID()
  tutorialId: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsBoolean()
  @IsOptional()
  resumeFromCheckpoint?: boolean;
}

export class UpdateStepProgressDto {
  @IsUUID()
  tutorialId: string;

  @IsUUID()
  stepId: string;

  @IsEnum(['in_progress', 'completed', 'skipped', 'failed'])
  status: StepProgressStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeSpent?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hintsUsed?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errors?: string[];

  @IsObject()
  @IsOptional()
  interactiveResult?: any;

  @IsObject()
  @IsOptional()
  saveState?: any;
}

export class SkipTutorialDto {
  @IsUUID()
  tutorialId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  confirmSkip?: boolean;
}

export class SkipStepDto {
  @IsUUID()
  tutorialId: string;

  @IsUUID()
  stepId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ResumeTutorialDto {
  @IsUUID()
  tutorialId: string;

  @IsUUID()
  @IsOptional()
  fromStepId?: string;

  @IsBoolean()
  @IsOptional()
  fromCheckpoint?: boolean;
}

export class SaveCheckpointDto {
  @IsUUID()
  tutorialId: string;

  @IsUUID()
  stepId: string;

  @IsObject()
  state: any;
}

export class CompleteTutorialDto {
  @IsUUID()
  tutorialId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  finalScore?: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class UserProgressFilterDto {
  @IsEnum(['not_started', 'in_progress', 'completed', 'skipped', 'abandoned'])
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  tutorialId?: string;
}
