import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CosmeticType, UnlockConditionType } from '../cosmetics.types';

export class UnlockConditionDto {
  @IsEnum(UnlockConditionType)
  type: UnlockConditionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  threshold?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  achievementId?: string;
}

export class CreateCosmeticDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and dashes',
  })
  @MaxLength(64)
  slug: string;

  @IsEnum(CosmeticType)
  type: CosmeticType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayText?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rarity?: string;

  @ValidateNested()
  @Type(() => UnlockConditionDto)
  unlockCondition: UnlockConditionDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCosmeticDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayText?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rarity?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UnlockConditionDto)
  unlockCondition?: UnlockConditionDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ListCosmeticsQueryDto {
  @IsOptional()
  @IsEnum(CosmeticType)
  type?: CosmeticType;
}

export class EquipCosmeticDto {
  @IsUUID()
  cosmeticId: string;
}

export class GrantCosmeticDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  source?: string;
}

export class PlayerMilestoneStatsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalXp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  puzzlesSolved?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  streakDays?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  achievementIds?: string[];
}

export class EvaluateUnlocksDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ValidateNested()
  @Type(() => PlayerMilestoneStatsDto)
  stats: PlayerMilestoneStatsDto;
}

/** Cosmetic data as served to clients. */
export interface CosmeticView {
  id: string;
  slug: string;
  type: CosmeticType;
  name: string;
  description: string | null;
  displayText: string | null;
  metadata: Record<string, unknown>;
  rarity: string;
}

/** Cosmetic data plus the requesting player's state. */
export interface PlayerCosmeticView extends CosmeticView {
  unlockedAt: Date;
  equipped: boolean;
}

/** What a profile shows for a player. */
export interface ProfileCosmeticsView {
  userId: string;
  title: CosmeticView | null;
  equipped: Partial<Record<CosmeticType, CosmeticView>>;
}
