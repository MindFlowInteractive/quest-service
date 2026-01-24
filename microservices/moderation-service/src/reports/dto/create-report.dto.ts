import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

export enum ReportReason {
    SPAM = 'SPAM',
    HATE_SPEECH = 'HATE_SPEECH',
    HARASSMENT = 'HARASSMENT',
    INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
    IMPERSONATION = 'IMPERSONATION',
    OTHER = 'OTHER',
}

export class CreateReportDto {
    @IsUUID()
    reporterId: string;

    @IsUUID()
    reportedEntityId: string;

    @IsString()
    reportedEntityType: string;

    @IsEnum(ReportReason)
    reason: ReportReason;

    @IsOptional()
    @IsString()
    description?: string;
}
