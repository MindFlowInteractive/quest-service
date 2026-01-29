import { Injectable } from '@nestjs/common';

/**
 * Service for A/B testing different difficulty algorithms.
 * Assigns players to groups and logs which algorithm was used.
 */
@Injectable()
export class AbTestingService {
  // In production, use persistent storage or analytics platform
  private playerGroups: Map<string, 'A' | 'B'> = new Map();

  /**
   * Assigns a player to an A/B group (A or B) deterministically.
   */
  assignGroup(playerId: string): 'A' | 'B' {
    if (this.playerGroups.has(playerId)) return this.playerGroups.get(playerId)!;
    // Simple hash: even/odd last char
    const group: 'A' | 'B' =
      parseInt(playerId.slice(-1), 16) % 2 === 0 ? 'A' : 'B';
    this.playerGroups.set(playerId, group);
    return group;
  }

  /**
   * Logs which algorithm was used for a player and puzzle.
   * In production, send to analytics or DB.
   */
  logAlgorithmUsage(playerId: string, puzzleId: string, algorithm: string) {
    // Placeholder: replace with real logging
    console.log(`A/B Test: Player ${playerId}, Puzzle ${puzzleId}, Algorithm ${algorithm}`);
  }
}
