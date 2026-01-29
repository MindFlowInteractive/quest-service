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
  MinLength,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  TriggerContext,
  HelpDisplayType,
} from '../entities/contextual-help.entity';
import { InteractionAction } from '../entities/contextual-help-interaction.entity';

export class HelpContentDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  body: string;

  @IsEnum(['tooltip', 'modal', 'overlay', 'sidebar', 'banner'])
  type: HelpDisplayType;

  @IsObject()
  @IsOptional()
  media?: {
    imageUrl?: string;
    videoUrl?: string;
    animationUrl?: string;
  };

  @IsArray()
  @IsOptional()
  actions?: Array<{
    label: string;
    action: 'dismiss' | 'learn_more' | 'show_tutorial' | 'custom';
    targetUrl?: string;
    tutorialId?: string;
  }>;
}

export class TriggerConditionsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAttempts?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAttempts?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeThreshold?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  errorPatterns?: string[];

  @IsObject()
  @IsOptional()
  userLevel?: { min?: number; max?: number };

  @IsBoolean()
  @IsOptional()
  hasCompletedTutorial?: boolean;

  @IsUUID()
  @IsOptional()
  tutorialId?: string;
}

export class DisplayRulesDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxShowCount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cooldownSeconds?: number;

  @IsBoolean()
  @IsOptional()
  showOnce?: boolean;

  @IsBoolean()
  @IsOptional()
  dismissable?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  autoHideAfter?: number;
}

export class CreateContextualHelpDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsEnum([
    'puzzle_start',
    'hint_needed',
    'repeated_failure',
    'first_visit',
    'feature_discovery',
    'idle_timeout',
    'achievement_near',
    'custom',
  ])
  triggerContext: TriggerContext;

  @IsString()
  @IsOptional()
  targetFeature?: string;

  @IsString()
  @IsOptional()
  targetPuzzleType?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ValidateNested()
  @Type(() => HelpContentDto)
  content: HelpContentDto;

  @ValidateNested()
  @Type(() => TriggerConditionsDto)
  @IsOptional()
  triggerConditions?: TriggerConditionsDto;

  @ValidateNested()
  @Type(() => DisplayRulesDto)
  @IsOptional()
  displayRules?: DisplayRulesDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateContextualHelpDto extends PartialType(CreateContextualHelpDto) {}

export class ContextualHelpFilterDto {
  @IsEnum([
    'puzzle_start',
    'hint_needed',
    'repeated_failure',
    'first_visit',
    'feature_discovery',
    'idle_timeout',
    'achievement_near',
    'custom',
  ])
  @IsOptional()
  triggerContext?: TriggerContext;

  @IsString()
  @IsOptional()
  targetFeature?: string;

  @IsString()
  @IsOptional()
  targetPuzzleType?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TriggerContextualHelpDto {
  @IsString()
  context: string;

  @IsUUID()
  @IsOptional()
  puzzleId?: string;

  @IsString()
  @IsOptional()
  puzzleType?: string;

  @IsString()
  @IsOptional()
  feature?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  attempts?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timeSpent?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recentErrors?: string[];

  @IsNumber()
  @IsOptional()
  userLevel?: number;
}

export class RecordHelpInteractionDto {
  @IsUUID()
  helpId: string;

  @IsEnum(['shown', 'dismissed', 'clicked', 'completed', 'auto_hidden'])
  action: InteractionAction;

  @IsNumber()
  @Min(0)
  @IsOptional()
  viewDuration?: number;

  @IsString()
  @IsOptional()
  actionTaken?: string;

  @IsObject()
  @IsOptional()
  context?: {
    puzzleId?: string;
    sessionId?: string;
    currentStep?: string;
    errorState?: string;
  };
}
