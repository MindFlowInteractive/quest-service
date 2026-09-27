import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TierRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rarity?: string;
}

export class CreateBattlePassDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Season identifier, e.g. "2025-Q1"' })
  @IsString()
  @IsNotEmpty()
  season: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: 'XP required to advance one tier' })
  @IsInt()
  @Min(1)
  xpPerTier: number;

  @ApiProperty({ description: 'Total number of tiers in this season' })
  @IsInt()
  @Min(1)
  totalTiers: number;
}

export class CreateTierDto {
  @ApiProperty({ description: 'Tier number (1-based)' })
  @IsInt()
  @Min(1)
  tierNumber: number;

  @ApiProperty({ description: 'Cumulative XP required to unlock this tier' })
  @IsInt()
  @Min(0)
  xpRequired: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  freeReward?: TierRewardDto;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  premiumReward?: TierRewardDto;
}

export class EarnXpDto {
  @ApiProperty({ description: 'XP points to award' })
  @IsInt()
  @Min(1)
  xp: number;
}

export class ClaimRewardDto {
  @ApiProperty({ description: 'Tier number to claim reward from' })
  @IsInt()
  @Min(1)
  tierNumber: number;

  @ApiProperty({ enum: ['free', 'premium'] })
  @IsString()
  @IsNotEmpty()
  track: 'free' | 'premium';
}
