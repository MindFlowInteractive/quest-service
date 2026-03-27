import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SpectateSessionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ToggleSpectatingDto {
  @IsOptional()
  spectatingAllowed: boolean;
}
