import { IsInt, IsNotEmpty, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsOptional()
  @IsString()
  difficultyVote?: 'easy' | 'medium' | 'hard' | 'expert';

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
