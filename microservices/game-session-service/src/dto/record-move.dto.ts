import { IsString, IsObject, IsNumber, Min } from 'class-validator';

export class RecordMoveDto {
  @IsString()
  sessionId: string;

  @IsString()
  moveType: string;

  @IsObject()
  moveData: any;

  @IsNumber()
  @Min(0)
  moveNumber: number;
}
