import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CompleteChallengeDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  score: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  timeSpent: number; // in seconds
}
