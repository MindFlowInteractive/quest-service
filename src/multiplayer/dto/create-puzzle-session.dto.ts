import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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

  /**
   * Steps the team must solve together to win. Omit for a free-form session
   * that is completed manually.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSolvedSteps?: string[];

  /**
   * Number of distinct players that must contribute to the required steps.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  minContributors?: number;

  /**
   * Require every connected player to contribute before the team wins.
   */
  @IsOptional()
  @IsBoolean()
  requireAllPlayers?: boolean;
}
