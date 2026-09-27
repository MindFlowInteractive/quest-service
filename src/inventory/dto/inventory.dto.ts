import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsObject,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemCategory, ItemRarity } from '../entities';

export class AddItemDto {
  @ApiProperty({ description: 'External item reference ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: 'Display name of the item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ItemCategory })
  @IsEnum(ItemCategory)
  category: ItemCategory;

  @ApiProperty({ enum: ItemRarity })
  @IsEnum(ItemRarity)
  rarity: ItemRarity;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxStack?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;
}

export class FilterInventoryDto {
  @ApiPropertyOptional({ enum: ItemCategory })
  @IsEnum(ItemCategory)
  @IsOptional()
  category?: ItemCategory;

  @ApiPropertyOptional({ enum: ItemRarity })
  @IsEnum(ItemRarity)
  @IsOptional()
  rarity?: ItemRarity;

  @ApiPropertyOptional({ description: 'Sort field: name | rarity | acquiredAt | quantity' })
  @IsString()
  @IsOptional()
  sortBy?: 'name' | 'rarity' | 'acquiredAt' | 'quantity';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsString()
  @IsOptional()
  order?: 'ASC' | 'DESC';
}
