import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsArray, IsObject, Min, Max, MinLength, MaxLength, IsUUID, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum PuzzleDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export enum PuzzleContentType {
  MULTIPLE_CHOICE = 'multiple-choice',
  FILL_BLANK = 'fill-blank',
  DRAG_DROP = 'drag-drop',
  CODE = 'code',
  VISUAL = 'visual',
  LOGIC_GRID = 'logic-grid'
}

export class PuzzleContentDto {
  @IsEnum(PuzzleContentType)
  type: PuzzleContentType;

  @IsString()
  @MinLength(10)
  question: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  correctAnswer: any;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsObject()
  media?: {
    images?: string[];
    videos?: string[];
    audio?: string[];
  };

  @IsOptional()
  @IsObject()
  interactive?: {
    components?: any[];
    rules?: any;
    initialState?: any;
  };
}

export class PuzzleHintDto {
  @IsNumber()
  @Min(1)
  order: number;

  @IsString()
  @MinLength(5)
  text: string;

  @IsNumber()
  @Min(0)
  pointsPenalty: number;

  @IsOptional()
  @IsNumber()
  unlockAfter?: number;
}

export class PuzzleScoringDto {
  @IsOptional()
  @IsObject()
  timeBonus?: {
    enabled: boolean;
    maxBonus: number;
    baseTime: number;
  };

  @IsOptional()
  @IsObject()
  accuracyBonus?: {
    enabled: boolean;
    maxBonus: number;
  };

  @IsOptional()
  @IsObject()
  streakBonus?: {
    enabled: boolean;
    multiplier: number;
  };
}

export class CreatePuzzleDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  description: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  category: string;

  @IsEnum(PuzzleDifficulty)
  difficulty: PuzzleDifficulty;

  @IsNumber()
  @Min(1)
  @Max(10)
  difficultyRating: number;

  @IsNumber()
  @Min(10)
  @Max(1000)
  basePoints: number;

  @IsNumber()
  @Min(30)
  @Max(3600)
  timeLimit: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  maxHints: number;

  @ValidateNested()
  @Type(() => PuzzleContentDto)
  content: PuzzleContentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PuzzleHintDto)
  hints?: PuzzleHintDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  prerequisites?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PuzzleScoringDto)
  scoring?: PuzzleScoringDto;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsUUID()
  parentPuzzleId?: string;
}
