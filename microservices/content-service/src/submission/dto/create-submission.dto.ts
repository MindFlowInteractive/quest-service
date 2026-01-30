import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  submitterNotes?: string;
}
