import {
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SlotConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxItems?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minViews?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minAgeInDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAgeInDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxPerCreator?: number;
}

export class FeaturedConfigDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotConfigDto)
  homepage_hero?: SlotConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotConfigDto)
  homepage_carousel?: SlotConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotConfigDto)
  weekly_picks?: SlotConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotConfigDto)
  editor_choice?: SlotConfigDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlotConfigDto)
  trending?: SlotConfigDto;
}
