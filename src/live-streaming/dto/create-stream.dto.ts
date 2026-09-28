import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStreamDto {
  @ApiProperty({ description: 'Human-readable stream title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'What the stream is about' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Capture the stream for later playback',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  recordingEnabled?: boolean;
}
