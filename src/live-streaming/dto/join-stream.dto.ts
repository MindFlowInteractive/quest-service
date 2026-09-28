import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StreamQuality } from '../entities/live-stream.entity';

export class JoinStreamDto {
  @ApiPropertyOptional({ description: 'Display name shown to the chat' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  username?: string;

  @ApiPropertyOptional({
    description: 'Preferred stream quality before bandwidth is measured',
    enum: StreamQuality,
  })
  @IsEnum(StreamQuality)
  @IsOptional()
  preferredQuality?: StreamQuality;

  @ApiPropertyOptional({
    description: 'Measured downstream bandwidth in kbps; adapts quality',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  bandwidthKbps?: number;
}
