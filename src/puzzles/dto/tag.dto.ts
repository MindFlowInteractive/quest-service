import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-z0-9\-]+$/, {
    message: 'Tag name must contain only lowercase letters, numbers, and hyphens',
  })
  @Transform(({ value }: any) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  name: string;
}

export enum TagSortBy {
  NAME = 'name',
  USAGE_COUNT = 'usageCount',
  CREATED_AT = 'createdAt',
}

export enum TagSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class ListTagsDto {
  @IsOptional()
  @IsEnum(TagSortBy)
  sortBy?: TagSortBy = TagSortBy.NAME;

  @IsOptional()
  @IsEnum(TagSortOrder)
  sortOrder?: TagSortOrder = TagSortOrder.ASC;
}

export class AttachTagsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }: any) =>
    Array.isArray(value)
      ? value.map((v: string) => v.trim().toLowerCase())
      : value,
  )
  tags: string[];
}
