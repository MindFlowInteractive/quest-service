import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateThemeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID({}, { each: true }) // Expect an array of UUIDs for collection IDs
  collectionIds?: string[];
}
