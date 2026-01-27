import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

export class SearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  size?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  order?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

export class PuzzleSearchDto extends SearchDto {
  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxRating?: number;
}

export class PlayerSearchDto extends SearchDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minLevel?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxLevel?: number;
}

export class AchievementSearchDto extends SearchDto {
  @IsOptional()
  @IsString()
  rarity?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AutocompleteDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  size?: number = 10;

  @IsOptional()
  @IsString()
  type?: string;
}
