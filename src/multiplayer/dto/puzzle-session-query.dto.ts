import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PuzzleSessionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
