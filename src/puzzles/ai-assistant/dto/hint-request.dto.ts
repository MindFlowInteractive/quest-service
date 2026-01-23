import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class HintRequestDto {
  @IsString()
  puzzleId: string;

  @IsString()
  userId: string;

  @IsOptional()
  currentState: any;

  @IsOptional()
  @IsNumber()
  previousAttempts?: number;

  @IsOptional()
  @IsIn(['basic', 'intermediate', 'advanced'])
  requestedHintLevel?: 'basic' | 'intermediate' | 'advanced';
}

export class ThinkingProcessRequestDto {
  @IsString()
  puzzleId: string;

  @IsString()
  userId: string;

  @IsOptional()
  currentState: any;

  @IsOptional()
  @IsString()
  specificStep?: string;
}

export class FeedbackDto {
  @IsString()
  userId: string;

  @IsString()
  puzzleId: string;

  @IsString()
  hintId: string;

  @IsOptional()
  wasHelpful?: boolean;

  @IsOptional()
  ledToProgress?: boolean;
}