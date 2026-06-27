import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterResearcherDto {
  @ApiProperty({ example: 'octocat' })
  @IsString()
  @Length(3, 100)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'handle may only contain letters, digits, underscores, hyphens' })
  handle: string;

  @ApiPropertyOptional({ example: 'octocat@github.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;
}

export class BlockResearcherDto {
  @ApiProperty({ description: 'Username or UUID of the admin performing the action' })
  @IsString()
  @IsNotEmpty()
  actor: string;

  @ApiProperty({ description: 'Reason for blocking the researcher' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
