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

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['single-elimination', 'double-elimination', 'round-robin', 'swiss'])
  bracketType:
    | 'single-elimination'
    | 'double-elimination'
    | 'round-robin'
    | 'swiss';

  @IsInt()
  @Min(2)
  @Max(256)
  maxParticipants: number;

  @IsDateString()
  registrationStartTime: string;

  @IsDateString()
  registrationEndTime: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsObject()
  entryRequirements?: {
    minLevel?: number;
    minScore?: number;
    minPuzzlesSolved?: number;
    requiredAchievements?: string[];
    entryFee?: number;
  };

  @IsObject()
  prizePool: {
    totalPrize: number;
    currency: 'points' | 'coins' | 'tokens';
    distribution: PrizeDistributionDto[];
    sponsorInfo?: {
      name: string;
      logo?: string;
    };
  };

  @IsOptional()
  @IsObject()
  config?: {
    puzzleCategories?: string[];
    difficultyRange?: {
      min: 'easy' | 'medium' | 'hard' | 'expert';
      max: 'easy' | 'medium' | 'hard' | 'expert';
    };
    matchDuration?: number;
    bestOf?: number;
    autoAdvance?: boolean;
    spectatorEnabled?: boolean;
    liveScoring?: boolean;
    tiebreaker?: 'time' | 'accuracy' | 'sudden-death';
  };

  @IsOptional()
  @IsObject()
  rules?: {
    noShows?: {
      waitTime: number;
      disqualifyAfter: number;
    };
    matchmaking?: {
      seedingMethod: 'random' | 'ranked' | 'seeded';
      autoMatch: boolean;
    };
    scoring?: {
      winPoints: number;
      lossPoints: number;
      drawPoints?: number;
    };
  };

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  metadata?: {
    bannerImage?: string;
    thumbnailImage?: string;
    streamUrl?: string;
    chatEnabled?: boolean;
    recordingsEnabled?: boolean;
  };
}
