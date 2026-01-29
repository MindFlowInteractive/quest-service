import {
  IsOptional,
  IsEnum,
  IsString,
  IsObject,
  IsArray,
} from 'class-validator';

export class UpdateTournamentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum([
    'scheduled',
    'registration',
    'in-progress',
    'completed',
    'cancelled',
  ])
  status?:
    | 'scheduled'
    | 'registration'
    | 'in-progress'
    | 'completed'
    | 'cancelled';

  @IsOptional()
  @IsObject()
  config?: {
    puzzleCategories?: string[];
    difficultyRange?: {
      min: 'easy' | 'medium' | 'hard' | 'expert';
      max: 'easy' | 'medium' | 'hard' | 'expert';
    };
    matchDuration?: number;
    bestOf?: number;
    autoAdvance?: boolean;
    spectatorEnabled?: boolean;
    liveScoring?: boolean;
    tiebreaker?: 'time' | 'accuracy' | 'sudden-death';
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: {
    bannerImage?: string;
    thumbnailImage?: string;
    streamUrl?: string;
    chatEnabled?: boolean;
    recordingsEnabled?: boolean;
  };
}
