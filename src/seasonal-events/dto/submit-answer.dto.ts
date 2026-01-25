import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  puzzleId: string;

  @IsNotEmpty()
  answer: any;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeTaken?: number; // in seconds

  @IsInt()
  @Min(0)
  @IsOptional()
  hintsUsed?: number;
}
