import { IsUUID, IsOptional, IsObject } from 'class-validator';

export class RegisterTournamentDto {
  @IsUUID()
  tournamentId: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    teamName?: string;
    teamMembers?: string[];
    notes?: string;
  };
}
