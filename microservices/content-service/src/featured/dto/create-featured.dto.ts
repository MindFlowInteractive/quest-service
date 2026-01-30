import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { FeaturedSlot, FeaturedReason } from '../../entities/featured-content.entity.js';

export class CreateFeaturedDto {
  @IsUUID()
  contentId: string;

  @IsEnum(FeaturedSlot)
  slot: FeaturedSlot;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsEnum(FeaturedReason)
  reason?: FeaturedReason;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
