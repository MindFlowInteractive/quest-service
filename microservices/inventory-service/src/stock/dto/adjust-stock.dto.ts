import { IsUUID, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty()
  @IsUUID()
  inventoryId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class SetStockDto {
  @ApiProperty()
  @IsUUID()
  inventoryId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  totalQuantity: number;
}