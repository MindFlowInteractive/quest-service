import { IsUUID, IsInt, IsOptional, IsArray, IsString } from 'class-validator';

export class SubmitMatchResultDto {
  @IsUUID()
  matchId: string;

  @IsUUID()
  winnerId: string;

  @IsInt()
  player1Score: number;

  @IsInt()
  player2Score: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  puzzleIds?: string[];

  @IsOptional()
  puzzleResults?: Array<{
    puzzleId: string;
    player1Time?: number;
    player1Score?: number;
    player1Correct?: boolean;
    player2Time?: number;
    player2Score?: number;
    player2Correct?: boolean;
    winner?: string;
  }>;
}
