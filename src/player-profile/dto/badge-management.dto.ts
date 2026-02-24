import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export enum BadgeCategory {
  ACHIEVEMENT = 'achievement',
  SKILL = 'skill',
  EVENT = 'event',
  SPECIAL = 'special',
  TOURNAMENT = 'tournament'
}

export class BadgeDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  iconUrl: string;

  @IsEnum(BadgeCategory)
  category: BadgeCategory;

  @IsOptional()
  @IsString()
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';

  @IsOptional()
  unlockedAt?: Date;
}

export class UpdateBadgesDto {
  @IsArray()
  @IsString({ each: true })
  displayedBadges: string[]; // Array of badge IDs to display on profile
}

export class BadgeDisplayConfigDto {
  @IsEnum(['grid', 'list', 'compact'])
  layout: 'grid' | 'list' | 'compact';

  @IsOptional()
  maxDisplayCount?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priorityOrder?: string[]; // Badge IDs in priority order
}