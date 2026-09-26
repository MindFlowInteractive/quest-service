import { IsIn, IsString, IsOptional, MaxLength } from 'class-validator';
import { AppealStatus } from '../enums/moderation.enums';

export class ResolveAppealDto {
  @IsIn([AppealStatus.ACCEPTED, AppealStatus.REJECTED])
  decision: AppealStatus.ACCEPTED | AppealStatus.REJECTED;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
