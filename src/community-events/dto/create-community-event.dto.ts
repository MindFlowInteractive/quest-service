import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityEventPhase } from '../entities/community-event.entity';

class EventPhaseDto {
  @ApiProperty({ enum: CommunityEventPhase })
  phase: CommunityEventPhase;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  bonusMultiplier?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

class ExclusiveRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  rank?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCommunityEventDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Event description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Visual theme of the event' })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({ description: 'Event start date' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: 'Event end date' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ description: 'Maximum number of participants' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'Event phases configuration' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPhaseDto)
  @IsOptional()
  phases?: EventPhaseDto[];

  @ApiPropertyOptional({ description: 'Exclusive rewards for the event' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExclusiveRewardDto)
  @IsOptional()
  exclusiveRewards?: ExclusiveRewardDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
