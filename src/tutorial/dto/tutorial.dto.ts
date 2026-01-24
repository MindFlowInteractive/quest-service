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
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  TutorialType,
  DifficultyLevel,
  TutorialMetadata,
} from '../entities/tutorial.entity';
import {
  StepType,
  StepContent,
  InteractiveConfig,
  CompletionCriteria,
  AdaptivePacing,
  StepAccessibility,
} from '../entities/tutorial-step.entity';

// Tutorial DTOs
export class CreateTutorialDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(['onboarding', 'mechanic', 'advanced', 'refresher'])
  type: TutorialType;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  category: string;

  @IsEnum(['beginner', 'easy', 'medium', 'hard', 'expert'])
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedDurationMinutes?: number;

  @IsArray()
  @IsUUID(4, { each: true })
  @IsOptional()
  prerequisites?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetMechanics?: string[];

  @IsBoolean()
  @IsOptional()
  isSkippable?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: TutorialMetadata;
}

export class UpdateTutorialDto extends PartialType(CreateTutorialDto) {}

export class TutorialFilterDto {
  @IsEnum(['onboarding', 'mechanic', 'advanced', 'refresher'])
  @IsOptional()
  type?: TutorialType;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['beginner', 'easy', 'medium', 'hard', 'expert'])
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  targetMechanic?: string;
}

// Step Content DTOs
export class StepContentDto {
  @IsString()
  @MinLength(5)
  instructions: string;

  @IsObject()
  @IsOptional()
  richContent?: { markdown?: string; html?: string };

  @IsObject()
  @IsOptional()
  media?: {
    images?: Array<{ url: string; alt: string; caption?: string }>;
    videos?: Array<{ url: string; caption?: string; duration?: number }>;
    animations?: Array<{ url: string; type: string }>;
  };

  @IsArray()
  @IsOptional()
  highlights?: Array<{
    elementSelector: string;
    description: string;
    action?: 'click' | 'hover' | 'focus';
  }>;

  @IsArray()
  @IsOptional()
  tooltips?: Array<{
    target: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  }>;
}

export class InteractiveConfigDto {
  @IsEnum(['drag-drop', 'click-sequence', 'input', 'selection', 'puzzle-mini'])
  type: string;

  @IsObject()
  config: Record<string, any>;

  @IsObject()
  expectedOutcome: any;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hints?: string[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;
}

export class CompletionCriteriaDto {
  @IsEnum(['auto', 'action', 'quiz', 'time', 'manual'])
  type: string;

  @IsArray()
  @IsOptional()
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minimumScore?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredActions?: string[];
}

export class AdaptivePacingDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  minTimeOnStep?: number;

  @IsBoolean()
  @IsOptional()
  skipIfProficient?: boolean;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  proficiencyThreshold?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  repeatIfStrugglingThreshold?: number;

  @IsBoolean()
  @IsOptional()
  adaptiveHints?: boolean;
}

export class StepAccessibilityDto {
  @IsString()
  @IsOptional()
  ariaLabel?: string;

  @IsString()
  @IsOptional()
  screenReaderText?: string;

  @IsObject()
  @IsOptional()
  keyboardShortcuts?: Record<string, string>;

  @IsObject()
  @IsOptional()
  reducedMotionAlternative?: any;

  @IsBoolean()
  @IsOptional()
  highContrastSupport?: boolean;
}

// TutorialStep DTOs
export class CreateTutorialStepDto {
  @IsUUID()
  tutorialId: string;

  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsEnum(['instruction', 'interactive', 'practice', 'quiz', 'demonstration', 'checkpoint'])
  type: StepType;

  @ValidateNested()
  @Type(() => StepContentDto)
  content: StepContentDto;

  @ValidateNested()
  @Type(() => InteractiveConfigDto)
  @IsOptional()
  interactive?: InteractiveConfigDto;

  @ValidateNested()
  @Type(() => CompletionCriteriaDto)
  @IsOptional()
  completionCriteria?: CompletionCriteriaDto;

  @ValidateNested()
  @Type(() => AdaptivePacingDto)
  @IsOptional()
  adaptivePacing?: AdaptivePacingDto;

  @ValidateNested()
  @Type(() => StepAccessibilityDto)
  @IsOptional()
  accessibility?: StepAccessibilityDto;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeLimit?: number;
}

export class UpdateTutorialStepDto extends PartialType(
  OmitType(CreateTutorialStepDto, ['tutorialId'] as const),
) {}

export class StepOrderDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(1)
  order: number;
}

export class ReorderStepsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepOrderDto)
  orders: StepOrderDto[];
}
