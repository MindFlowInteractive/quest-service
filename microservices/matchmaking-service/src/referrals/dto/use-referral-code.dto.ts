import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UseReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  campaign?: string;
}
