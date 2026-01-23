export interface BracketNode {
  matchId: string;
  roundNumber: number;
  matchNumber: number;
  player1?: {
    id: string;
    name: string;
    seed?: number;
  };
  player2?: {
    id: string;
    name: string;
    seed?: number;
  };
  winner?: {
    id: string;
    name: string;
  };
  status: 'scheduled' | 'ready' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  nextMatchId?: string;
  loserNextMatchId?: string;
}

export interface TournamentBracket {
  tournamentId: string;
  bracketType:
    | 'single-elimination'
    | 'double-elimination'
    | 'round-robin'
    | 'swiss';
  rounds: BracketRound[];
  totalRounds: number;
  currentRound: number;
}

export interface BracketRound {
  roundNumber: number;
  roundName: string;
  matches: BracketNode[];
  startTime?: Date;
  endTime?: Date;
  isComplete: boolean;
}

export interface MatchPairing {
  player1Id: string;
  player1Name: string;
  player1Seed?: number;
  player2Id: string;
  player2Name: string;
  player2Seed?: number;
  roundNumber: number;
  matchNumber: number;
}

export interface TournamentStandings {
  tournamentId: string;
  participants: ParticipantStanding[];
  lastUpdated: Date;
}

export interface ParticipantStanding {
  participantId: string;
  userId: string;
  username: string;
  position: number;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  averageAccuracy: number;
  status: string;
}

export interface PrizeDistribution {
  participantId: string;
  userId: string;
  username: string;
  position: number;
  prizeAmount: number;
  currency: string;
  badges?: string[];
  achievements?: string[];
}
