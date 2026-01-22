import { IsUUID, IsOptional, IsString, IsInt } from 'class-validator';

export class AddItemDto {
  @IsUUID()
  puzzleId: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
