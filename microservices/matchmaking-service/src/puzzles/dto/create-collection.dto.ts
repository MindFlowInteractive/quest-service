import { IsString, IsOptional, IsArray, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer'; // For nested object validation

// Define a type for the reward structure for better validation
class RewardDto {
  @IsString()
  type: string; // e.g., 'currency', 'item', 'experience'

  @IsObject() // Use IsObject for value, or more specific if structure is known
  value: any;

  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class CreateCollectionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID({}, { each: true })
  puzzleIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID({}, { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true }) // Validate each item in the array as a RewardDto
  @Type(() => RewardDto) // Transform plain objects to RewardDto instances
  rewards?: RewardDto[];
}