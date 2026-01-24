import { PartialType } from '@nestjs/mapped-types'; // Using @nestjs/mapped-types for PartialType
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
