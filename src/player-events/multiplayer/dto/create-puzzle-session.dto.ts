import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreatePuzzleSessionDto {
  @IsString()
  puzzleId: string;

  @IsInt()
  @Min(2)
  @Max(50)
  maxPlayers = 10;

  @IsInt()
  @Min(60)
  @Max(7200)
  durationSeconds = 1800;
}
