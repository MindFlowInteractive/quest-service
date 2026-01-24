
export type BracketType =
  | 'single-elimination'
  | 'double-elimination'
  | 'round-robin';

export interface BracketError {
  message: string;
}

export interface SingleEliminationBracket {
  rounds: { player1: string; player2: string | null }[][];
}

export interface RoundRobinBracket {
  matches: { player1: string; player2: string }[];
}

export type BracketResult = SingleEliminationBracket | RoundRobinBracket | BracketError;

export class TournamentBracketGenerator {
  static generate(
    players: string[],
    type: BracketType = 'single-elimination',
  ): BracketResult {
    switch (type) {
      case 'single-elimination':
        return this.generateSingleElimination(players);
      case 'double-elimination':
        // Placeholder for double elimination logic
        return { message: 'Double elimination not implemented' };
      case 'round-robin':
        return this.generateRoundRobin(players);
      default:
        return { message: 'Unknown bracket type' };
    }
  }

  private static generateSingleElimination(players: string[]): SingleEliminationBracket | BracketError {
    if (players.length < 2) {
      return { message: 'Not enough players' };
    }
    // Shuffle players
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const rounds: { player1: string; player2: string | null }[][] = [];
    let current: string[] = shuffled;
    while (current.length > 1) {
      const round: { player1: string; player2: string | null }[] = [];
      for (let i = 0; i < current.length; i += 2) {
        round.push({
          player1: current[i],
          player2: current[i + 1] || null,
        });
      }
      rounds.push(round);
      current = round
        .filter((match) => !match.player2)
        .map((match) => match.player1);
    }
    return { rounds };
  }

  private static generateRoundRobin(players: string[]): RoundRobinBracket | BracketError {
    if (players.length < 2) {
      return { message: 'Not enough players' };
    }
    const matches: { player1: string; player2: string }[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        matches.push({ player1: players[i], player2: players[j] });
      }
    }
    return { matches };
  }
}

export function isBracketError(bracket: BracketResult): bracket is BracketError {
  return (bracket as BracketError).message !== undefined;
}
