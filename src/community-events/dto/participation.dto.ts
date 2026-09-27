import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordParticipationDto {
  @ApiProperty({ description: 'Player / user ID performing the action' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Points to award for the action', minimum: 0 })
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({ description: 'Arbitrary action metadata' })
  @IsObject()
  @IsOptional()
  actionMetadata?: Record<string, any>;
}

export class CreateMilestoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Score threshold to unlock this milestone' })
  @IsInt()
  @Min(0)
  requiredScore: number;

  @ApiProperty({ description: 'Reward granted when this milestone is reached' })
  @IsObject()
  reward: {
    type: 'points' | 'badge' | 'item' | 'currency' | 'title';
    value?: number;
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  };

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxClaims?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
