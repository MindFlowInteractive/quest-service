import { IsUUID, IsString, IsEnum, IsOptional } from 'class-validator';
import { ReviewDecision } from '../../entities/review.entity';
import { ActionTaken } from '../../entities/violation.entity';

export class ResolveReportDto {
    @IsUUID()
    moderatorId: string;

    @IsEnum(ReviewDecision)
    decision: ReviewDecision;

    @IsOptional()
    @IsString()
    comments?: string;

    @IsOptional()
    @IsEnum(ActionTaken)
    actionToTake?: ActionTaken;
}
