export type TournamentFormat = 'single_elimination';

export interface Participant {
  id: string;
  name: string;
  seed?: number;
  rating?: number; // For automated ranking/seeding
}

export interface Match {
  id: string;
  roundIndex: number;
  matchIndex: number;
  participant1Id: string | null; // null or 'BYE'
  participant2Id: string | null;
  winnerId: string | null;
  status: 'pending' | 'ready' | 'completed' | 'bye';
  nextMatchId?: string | null;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
}

export interface TournamentBracket {
  tournamentId: string;
  format: TournamentFormat;
  totalParticipants: number;
  rounds: Round[];
}

export interface TournamentAnalytics {
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  byesCount: number;
  completionPercentage: number;
  currentRound: number;
}