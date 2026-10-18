import { IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { PuzzlePlayerRole } from '../enums/puzzle-player-role.enum';

export class AssignRoleDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @Length(1, 128)
  targetUserId: string;

  @IsEnum(PuzzlePlayerRole)
  role: PuzzlePlayerRole;
}

/**
 * REST variant: the session id comes from the URL path.
 */
export class AssignRoleBodyDto {
  @IsString()
  @Length(1, 128)
  targetUserId: string;

  @IsEnum(PuzzlePlayerRole)
  role: PuzzlePlayerRole;
}
