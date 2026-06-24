import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  criteria: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSegmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  criteria?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
