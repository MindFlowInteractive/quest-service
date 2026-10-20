import { IsString, IsOptional, IsUUID, IsInt, Min, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  // We might not need to link puzzles or collections directly during creation,
  // as those can be managed via separate endpoints or by updating the puzzle/collection.
  // However, if the schema implies a direct link that must be set at creation,
  // it would be added here (e.g., @IsArray(), @IsUUID() for puzzleIds).
  // For now, keeping it simple for basic category creation.
}
