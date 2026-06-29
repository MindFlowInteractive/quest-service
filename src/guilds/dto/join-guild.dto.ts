import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class JoinGuildDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  inviteCode?: string;
}
