import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GrantGracePeriodDto {
  /**
   * Length of the recovery window in hours (1-168, i.e. up to one week).
   * Defaults to 24 hours when omitted.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours?: number;
}
