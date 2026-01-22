import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsInt, 
  IsBoolean, 
  IsArray, 
  IsObject, 
  Min, 
  Max, 
  Length,
  ValidateNested,
  IsJSON
} from 'class-validator';
import { Type } from 'class-transformer';
import { PuzzleSubmissionStatus, ModerationAction } from '../entities/user-puzzle-submission.entity';

export class CreatePuzzleSubmissionDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['logic', 'math', 'pattern', 'word', 'spatial', 'memory', 'strategy'])
  category: string;

  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';

  @IsInt()
  @Min(1)
  @Max(10)
  difficultyRating: number;

  @IsInt()
  @Min(10)
  @Max(1000)
  basePoints: number;

  @IsInt()
  @Min(60)
  @Max(3600)
  timeLimit: number;

  @IsInt()
  @Min(0)
  @Max(10)
  maxHints: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PuzzleContentDto)
  content: PuzzleContentDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PuzzleHintDto)
  hints: PuzzleHintDto[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean = true;

  @IsOptional()
  @IsBoolean()
  allowRatings?: boolean = true;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SharingSettingsDto)
  sharingSettings?: SharingSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreatorNotesDto)
  creatorNotes?: CreatorNotesDto;
}

export class PuzzleContentDto {
  @IsEnum(['multiple-choice', 'fill-blank', 'drag-drop', 'code', 'visual', 'logic-grid'])
  type: 'multiple-choice' | 'fill-blank' | 'drag-drop' | 'code' | 'visual' | 'logic-grid';

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  correctAnswer?: any;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MediaContentDto)
  media?: MediaContentDto;

  @IsOptional()
  @IsObject()
  interactive?: any;
}

export class MediaContentDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audio?: string[];
}

export class PuzzleHintDto {
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  text: string;

  @IsInt()
  @Min(0)
  @Max(50)
  pointsPenalty: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unlockAfter?: number;
}

export class SharingSettingsDto {
  @IsOptional()
  @IsBoolean()
  allowShare?: boolean = true;

  @IsOptional()
  @IsBoolean()
  embeddable?: boolean = false;

  @IsOptional()
  @IsBoolean()
  downloadAllowed?: boolean = false;

  @IsOptional()
  @IsBoolean()
  attributionRequired?: boolean = true;
}

export class CreatorNotesDto {
  @IsOptional()
  @IsString()
  @Length(0, 500)
  inspiration?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  targetAudience?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  estimatedTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningObjectives?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];
}

export class UpdatePuzzleSubmissionDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(10, 2000)
  description?: string;

  @IsOptional()
  @IsEnum(['logic', 'math', 'pattern', 'word', 'spatial', 'memory', 'strategy'])
  category?: string;

  @IsOptional()
  @IsEnum(['easy', 'medium', 'hard', 'expert'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficultyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(1000)
  basePoints?: number;

  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  timeLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  maxHints?: number;

  @IsOptional()
  @IsObject()
  content?: PuzzleContentDto;

  @IsOptional()
  @IsArray()
  hints?: PuzzleHintDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRatings?: boolean;

  @IsOptional()
  @IsObject()
  sharingSettings?: SharingSettingsDto;

  @IsOptional()
  @IsObject()
  creatorNotes?: CreatorNotesDto;
}

export class SubmitForReviewDto {
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  reviewerNotes?: string;
}

export class ModerationDecisionDto {
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @IsString()
  @Length(0, 1000)
  reviewNotes: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredChanges?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  qualityScore?: number;
}
