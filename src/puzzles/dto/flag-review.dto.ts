import { IsString, IsNotEmpty } from 'class-validator';

export class FlagReviewDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
