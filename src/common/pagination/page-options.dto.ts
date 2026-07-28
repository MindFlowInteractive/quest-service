import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PageOptionsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit?: number = 10;

  @IsString()
  @IsOptional()
  readonly sort?: string;

  @IsString()
  @IsOptional()
  readonly filter?: string;

  @IsString()
  @IsOptional()
  readonly cursor?: string;
}
