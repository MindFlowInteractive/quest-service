import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, Max, IsInt } from 'class-validator';

export class CreateGuildDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(4)
  tag: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsOptional()
  @Max(100)
  maxMembers?: number;
}
