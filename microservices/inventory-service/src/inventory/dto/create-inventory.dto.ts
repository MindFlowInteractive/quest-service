import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType, ItemStatus } from './entities/inventory.entity';

export class CreateInventoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ItemType })
  @IsEnum(ItemType)
  type: ItemType;

  @ApiPropertyOptional({ enum: ItemStatus })
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  marketplaceId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  lowStockThreshold?: number;
}

export class UpdateInventoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ItemStatus })
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  lowStockThreshold?: number;
}