import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';

export class FilterPlayerBehaviorDto {
  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
