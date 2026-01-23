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
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePuzzleRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  review?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RatingBreakdownDto)
  ratingBreakdown?: RatingBreakdownDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RatingMetadataDto)
  metadata?: RatingMetadataDto;
}

export class RatingBreakdownDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  creativity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  clarity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  enjoyment?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  educational?: number;
}

export class RatingMetadataDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  playTime?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hintsUsed?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean;

  @IsOptional()
  @IsString()
  reportReason?: string;
}

export class CreatePuzzleCommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdatePuzzleCommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;
}

export class PuzzleCommentVoteDto {
  @IsEnum(['upvote', 'downvote'])
  voteType: 'upvote' | 'downvote';
}

export class ReportPuzzleCommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  reason: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  additionalDetails?: string;
}

export class ReportPuzzleDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 500)
  reason: string;

  @IsOptional()
  @IsEnum(['inappropriate', 'copyright', 'spam', 'low_quality', 'duplicate', 'other'])
  category?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  additionalDetails?: string;
}

export class SearchPuzzlesDto {
  @IsOptional()
  @IsString()
  @Length(0, 100)
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(['easy', 'medium', 'hard', 'expert'], { each: true })
  difficulties?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'popular', 'highest_rated', 'most_played', 'trending'])
  sortBy?: string;

  @IsOptional()
  @IsEnum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'published', 'featured'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRatings?: boolean;
}

export class SharePuzzleDto {
  @IsOptional()
  @IsEnum(['link', 'embed', 'social'])
  shareType?: 'link' | 'embed' | 'social';

  @IsOptional()
  @IsEnum(['twitter', 'facebook', 'reddit', 'discord', 'whatsapp'])
  platform?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  customMessage?: string;
}
