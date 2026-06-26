import { IsString, IsUrl, IsOptional, IsNumber, Min, Max, IsArray, ArrayNotEmpty } from 'class-validator';

export class RegisterInstanceDto {
  @IsString()
  route: string;

  @IsUrl()
  targetUrl: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  weight?: number;
}
