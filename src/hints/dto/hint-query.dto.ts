import {
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const HINT_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

export class HintCostPreviewDto {
  @IsUUID()
  puzzleId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsIn(HINT_DIFFICULTIES)
  difficulty?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hintCount?: number;
}

export class HintLimitsQueryDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  puzzleId: string;
}

export class HintUserQueryDto {
  @IsUUID()
  userId: string;
}
