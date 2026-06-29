import { IsString, IsNumber, IsOptional } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  inviteCode: string;

  @IsString()
  userId: string;

  @IsString()
  username: string;

  @IsNumber()
  skillLevel: number;
}
