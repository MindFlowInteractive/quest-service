import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePuzzleDto } from './create-puzzle.dto';
import { IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';

export class UpdatePuzzleDto extends PartialType(
  OmitType(CreatePuzzleDto, ['parentPuzzleId'] as const)
) {
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  updateReason?: string;
}
