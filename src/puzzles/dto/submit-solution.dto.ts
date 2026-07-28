import { IsString, IsOptional, IsIn, ValidateIf } from 'class-validator';
import { IsSafeString, Trim } from '../../validators';

export enum SubmissionStatus {
  DRAFT = 'draft',
  FINAL = 'final',
}

export class SubmitSolutionDto {
  @IsIn([SubmissionStatus.DRAFT, SubmissionStatus.FINAL])
  status: SubmissionStatus;

  @IsString()
  @IsSafeString({ groups: [SubmissionStatus.DRAFT, SubmissionStatus.FINAL] })
  @Trim({ groups: [SubmissionStatus.DRAFT, SubmissionStatus.FINAL] })
  solution: string;

  @ValidateIf((o) => o.status === SubmissionStatus.FINAL)
  @IsString()
  @IsSafeString({ groups: [SubmissionStatus.FINAL] })
  @Trim({ groups: [SubmissionStatus.FINAL] })
  explanation?: string;
}
