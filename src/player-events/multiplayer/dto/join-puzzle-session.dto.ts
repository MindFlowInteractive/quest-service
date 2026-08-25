import { IsUUID } from 'class-validator';

export class JoinPuzzleSessionDto {
  @IsUUID()
  sessionId: string;
}
