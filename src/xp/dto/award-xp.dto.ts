import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AwardXpDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  sourceEventId: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
