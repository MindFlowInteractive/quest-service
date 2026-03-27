import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  userId: string;

  /**
   * Optional puzzle ID. When provided the session is locked to the
   * puzzle version that is live at creation time.
   */
  @IsOptional()
  @IsUUID()
  puzzleId?: string;
}
