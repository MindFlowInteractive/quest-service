import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  /**
   * When true, the subscription ends immediately.
   * When false (default), it remains active until the current period ends.
   */
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = false;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
