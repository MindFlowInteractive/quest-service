import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class SubmitAppealDto {
  @IsUUID()
  flagId: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  reason: string;
}
