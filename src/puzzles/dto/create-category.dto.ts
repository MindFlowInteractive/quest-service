import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // We might not need to link puzzles or collections directly during creation,
  // as those can be managed via separate endpoints or by updating the puzzle/collection.
  // However, if the schema implies a direct link that must be set at creation,
  // it would be added here (e.g., @IsArray(), @IsUUID() for puzzleIds).
  // For now, keeping it simple for basic category creation.
}
