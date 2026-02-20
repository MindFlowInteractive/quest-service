import { IsOptional, IsEnum, IsInt, IsDateString } from 'class-validator';

export class GetQuestChainsDto {
  @IsEnum(['active', 'inactive', 'archived', 'all'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived' | 'all';

  @IsInt()
  @IsOptional()
  limit?: number;

  @IsInt()
  @IsOptional()
  offset?: number;

  @IsDateString()
  @IsOptional()
  startsAfter?: Date;

  @IsDateString()
  @IsOptional()
  endsBefore?: Date;

  @IsOptional()
  sortBy?: 'createdAt' | 'completionCount' | 'name';

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}