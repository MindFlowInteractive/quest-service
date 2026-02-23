import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @Length(50, 1000)
  reviewText: string;
}
