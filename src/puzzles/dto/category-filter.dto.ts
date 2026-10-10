import { IsOptional, IsString, IsUUID, IsBoolean, IsArray, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CategoryFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: any) => (value === 'true' || value === true))
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: any) => (value === 'true' || value === true))
  includeChildren?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: any) => {
    if (typeof value === 'string') return value.split(',').map((v) => v.trim().toLowerCase());
    if (Array.isArray(value)) return value.map((v) => String(v).trim().toLowerCase());
    return value;
  })
  tags?: string[];

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export interface CategoryAnalyticsDto {
  categoryId: string;
  categoryName: string;
  totalPuzzles: number;
  totalCompletions: number;
  averageRating: number;
  difficultyBreakdown: Record<string, number>;
  popularityScore: number;
}
