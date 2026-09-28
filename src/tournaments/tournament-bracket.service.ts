import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Participant, Match, Round, TournamentBracket, TournamentAnalytics } from './tournament.types';

@Injectable()
export class TournamentBracketService {
  /**
   * 1. Seeding Algorithm (Standard Power-of-2 bracket seeding)
   */
  public seedParticipants(participants: Participant[]): Participant[] {
    // Sort by rating descending if seed is not explicitly set
    const sorted = [...participants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    
    const n = sorted.length;
    let power = 1;
    while (power < n) power *= 2;

    // Create padded array with BYEs (null)
    const seeded: (Participant | null)[] = new Array(power).fill(null);
    
    // Standard seeding placement algorithm for power of 2
    const getSeedingOrder = (size: number): number[] => {
      if (size === 2) return [0, 1];
      const prev = getSeedingOrder(size / 2);
      const result: number[] = [];
      for (const p of prev) {
        result.push(2 * p);
        result.push(size - 1 - 2 * p);
      }
      return result;
    };

    const order = getSeedingOrder(power);
    for (let i = 0; i < n; i++) {
      seeded[order[i]] = { ...sorted[i], seed: i + 1 };
    }

    // Convert back with nulls representing Byes
    return seeded.map((p, idx) => p || { id: `bye_${idx + 1}`, name: 'BYE', seed: idx + 1 });
  }

  /**
   * 2. Bracket Generation & Bye Handling
   */
  public generateBracket(tournamentId: string, participants: Participant[]): TournamentBracket {
    if (participants.length < 2) {
      throw new BadRequestException('At least 2 participants are required to generate a bracket.');
    }

    const seededParticipants = this.seedParticipants(participants);
    const totalSlots = seededParticipants.length;
    const totalRounds = Math.log2(totalSlots);

    const rounds: Round[] = [];
    let matchCounter = 1;

    // Build Round 1
    const round1Matches: Match[] = [];
    for (let i = 0; i < totalSlots; i += 2) {
      const p1 = seededParticipants[i];
      const p2 = seededParticipants[i + 1];
      const isByeMatch = p1.name === 'BYE' || p2.name === 'BYE';

      let winnerId: string | null = null;
      let status: Match['status'] = 'ready';

      if (p1.name === 'BYE') {
        winnerId = p2.id;
        status = 'bye';
      } else if (p2.name === 'BYE') {
        winnerId = p1.id;
        status = 'bye';
      }

      round1Matches.push({
        id: `match_${tournamentId}_r1_${matchCounter++}`,
        roundIndex: 1,
        matchIndex: round1Matches.length + 1,
        participant1Id: p1.name === 'BYE' ? null : p1.id,
        participant2Id: p2.name === 'BYE' ? null : p2.id,
        winnerId,
        status,
      });
    }
    rounds.push({ roundNumber: 1, matches: round1Matches });

    // Build Subsequent Rounds
    for (let r = 2; r <= totalRounds; r++) {
      const prevRoundMatches = rounds[r - 2].matches;
      const currentRoundMatches: Match[] = [];

      for (let i = 0; i < prevRoundMatches.length; i += 2) {
        currentRoundMatches.push({
          id: `match_${tournamentId}_r${r}_${matchCounter++}`,
          roundIndex: r,
          matchIndex: currentRoundMatches.length + 1,
          participant1Id: null, // Populated as previous round finishes
          participant2Id: null,
          winnerId: null,
          status: 'pending',
        });
      }
      rounds.push({ roundNumber: r, matches: currentRoundMatches });
    }

    // Auto-advance winners of round 1 byes into round 2
    this.propagateByeWinners(rounds);

    return {
      tournamentId,
      format: 'single_elimination',
      totalParticipants: participants.length,
      rounds,
    };
  }

  private propagateByeWinners(rounds: Round[]): void {
    if (rounds.length < 2) return;

    const r1Matches = rounds[0].matches;
    const r2Matches = rounds[1].matches;

    for (let i = 0; i < r1Matches.length; i++) {
      const m1 = r1Matches[i];
      if (m1.status === 'bye' && m1.winnerId) {
        const targetMatchIndex = Math.floor(i / 2);
        const targetMatch = r2Matches[targetMatchIndex];
        const isFirstSlot = i % 2 === 0;

        if (isFirstSlot) {
          targetMatch.participant1Id = m1.winnerId;
        } else {
          targetMatch.participant2Id = m1.winnerId;
        }

        if (targetMatch.participant1Id && targetMatch.participant2Id) {
          targetMatch.status = 'ready';
        }
      }
    }
  }

  /**
   * 3. Match Advancement & Winner Determination
   */
  public advanceMatch(bracket: TournamentBracket, matchId: string, winnerId: string): TournamentBracket {
    let found = false;

    for (let r = 0; r < bracket.rounds.length; r++) {
      const round = bracket.rounds[r];
      const match = round.matches.find((m) => m.id === matchId);

      if (match) {
        found = true;
        if (match.status === 'completed') {
          throw new BadRequestException('Match is already completed.');
        }
        if (match.participant1Id !== winnerId && match.participant2Id !== winnerId) {
          throw new BadRequestException('Winner must be one of the participants in this match.');
        }

        match.winnerId = winnerId;
        match.status = 'completed';

        // Propagate winner to next round if exists
        if (r + 1 < bracket.rounds.length) {
          const nextRound = bracket.rounds[r + 1];
          const nextMatchIndex = Math.floor((match.matchIndex - 1) / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];
          const isFirstSlot = (match.matchIndex - 1) % 2 === 0;

          if (isFirstSlot) {
            nextMatch.participant1Id = winnerId;
          } else {
            nextMatch.participant2Id = winnerId;
          }

          if (nextMatch.participant1Id && nextMatch.participant2Id) {
            nextMatch.status = 'ready';
          }
        }
        break;
      }
    }

    if (!found) {
      throw new NotFoundException(`Match with ID ${matchId} not found in bracket.`);
    }

    return bracket;
  }

  /**
   * 4. Bracket Reset
   */
  public resetBracket(tournamentId: string, originalParticipants: Participant[]): TournamentBracket {
    return this.generateBracket(tournamentId, originalParticipants);
  }

  /**
   * 5. Tournament Analytics & Progress Tracking
   */
  public getAnalytics(bracket: TournamentBracket): TournamentAnalytics {
    let totalMatches = 0;
    let completedMatches = 0;
    let pendingMatches = 0;
    let byesCount = 0;
    let currentRound = 1;

    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        totalMatches++;
        if (match.status === 'completed') {
          completedMatches++;
        } else if (match.status === 'bye') {
          byesCount++;
          completedMatches++;
        } else {
          pendingMatches++;
        }
      }
    }

    // Determine current active round
    for (let i = 0; i < bracket.rounds.length; i++) {
      const hasReadyOrPending = bracket.rounds[i].matches.some(
        (m) => m.status === 'ready' || m.status === 'pending'
      );
      if (hasReadyOrPending) {
        currentRound = bracket.rounds[i].roundNumber;
        break;
      }
    }

    const completionPercentage = totalMatches > 0 ? Number(((completedMatches / totalMatches) * 100).toFixed(2)) : 0;

    return {
      totalMatches,
      completedMatches,
      pendingMatches,
      byesCount,
      completionPercentage,
      currentRound,
    };
  }
}