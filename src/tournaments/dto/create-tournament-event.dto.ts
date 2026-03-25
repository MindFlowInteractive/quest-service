import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsDateString,
  IsObject,
  IsArray,
  Min,
  Max,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrizeDistributionDto {
  @IsInt()
  @Min(1)
  position: number;

  @IsInt()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievements?: string[];
}

export class CreateTournamentEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  maxParticipants: number;

  @IsArray()
  @IsUUID('4', { each: true })
  puzzleIds: string[];

  @IsObject()
  rewardPool: {
    totalPrize?: number;
    currency?: 'points' | 'coins' | 'tokens';
    distribution?: PrizeDistributionDto[];
  };

  @IsOptional()
  @IsString()
  description?: string;
}