import { IsString, IsOptional, IsUUID, IsArray, ArrayUnique } from 'class-validator';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  tagNames?: string[]; // create/reuse by name
}
