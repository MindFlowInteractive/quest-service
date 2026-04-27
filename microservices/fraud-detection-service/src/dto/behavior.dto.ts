import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatternType } from '../entities/behavior-pattern.entity';

export class RecordBehaviorEventDto {
  @ApiProperty({ description: 'Player UUID' })
  @IsUUID()
  playerId: string;

  @ApiProperty({ enum: PatternType })
  @IsEnum(PatternType)
  patternType: PatternType;

  @ApiProperty({ description: 'Metric feature map (e.g. { actionsPerMinute: 45 })' })
  @IsObject()
  features: Record<string, number>;
}

export class AnalyzePlayerDto {
  @ApiProperty({ description: 'Player UUID to analyze' })
  @IsUUID()
  playerId: string;

  @ApiPropertyOptional({ description: 'Look-back window in minutes', default: 60 })
  @IsOptional()
  windowMinutes?: number;
}
