import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsUUID, Min, Max, IsObject } from 'class-validator';

export enum HintType {
  GENERAL = 'general',
  CONTEXTUAL = 'contextual',
  STRATEGIC = 'strategic',
  SPECIFIC = 'specific',
  TUTORIAL = 'tutorial'
}

export class CreateHintDto {
  @IsUUID()
  puzzleId: string;

  @IsNumber()
  @Min(1)
  order: number;

  @IsEnum(HintType)
  type: HintType;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  contextualData?: {
    triggerConditions?: string[];
    playerState?: any;
    puzzleState?: any;
  };

  @IsNumber()
  @Min(0)
  cost: number;

  @IsNumber()
  @Min(0)
  pointsPenalty: number;

  @IsOptional()
  @IsNumber()
  unlockAfterSeconds?: number;

  @IsOptional()
  @IsNumber()
  unlockAfterAttempts?: number;

  @IsOptional()
  @IsObject()
  skillLevelTarget?: {
    minLevel?: number;
    maxLevel?: number;
    preferredLevel?: number;
  };
}

export class RequestHintDto {
  @IsUUID()
  puzzleId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(1)
  attemptNumber: number;

  @IsNumber()
  @Min(0)
  timeSpent: number;

  @IsOptional()
  @IsObject()
  playerState?: {
    skillLevel?: number;
    previousHintsUsed?: number;
    currentAttempts?: number;
    timeElapsed?: number;
  };

  @IsOptional()
  @IsObject()
  puzzleState?: {
    progress?: any;
    currentStep?: string;
    errors?: string[];
  };
}

export class HintUsageDto {
  @IsUUID()
  hintId: string;

  @IsUUID()
  puzzleId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(1)
  attemptNumber: number;

  @IsNumber()
  @Min(0)
  timeSpent: number;

  @IsBoolean()
  ledToCompletion: boolean;

  @IsOptional()
  @IsNumber()
  timeToCompletion?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  satisfactionRating: number;

  @IsOptional()
  @IsObject()
  playerState?: any;

  @IsOptional()
  @IsObject()
  puzzleState?: any;
}
