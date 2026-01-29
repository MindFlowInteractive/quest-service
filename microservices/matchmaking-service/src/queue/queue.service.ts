import { Injectable } from '@nestjs/common';
import { Player } from '../player/player.interface';
import { isEloCompatible } from '../elo/elo.util';

@Injectable()
export class QueueService {
  private queue: Player[] = [];
  private readonly BASE_ELO_RANGE = 100;
  private readonly TIMEOUT_MS = 60_000;

  addPlayer(player: Player) {
    this.queue.push(player);
  }

  removePlayer(playerId: string) {
    this.queue = this.queue.filter(p => p.id !== playerId);
  }

  getQueue() {
    return this.queue;
  }

  findMatch(): [Player, Player] | null {
    for (let i = 0; i < this.queue.length; i++) {
      for (let j = i + 1; j < this.queue.length; j++) {
        const a = this.queue[i];
        const b = this.queue[j];

        const timeWaiting =
          Math.min(Date.now() - a.joinedAt, Date.now() - b.joinedAt);

        const dynamicRange =
          this.BASE_ELO_RANGE + Math.floor(timeWaiting / 10_000) * 50;

        if (
          isEloCompatible(a.elo, b.elo, dynamicRange) &&
          this.preferencesMatch(a, b)
        ) {
          return [a, b];
        }
      }
    }
    return null;
  }

  cleanupIdlePlayers() {
    const now = Date.now();
    this.queue = this.queue.filter(
      p => now - p.joinedAt < this.TIMEOUT_MS,
    );
  }

  private preferencesMatch(a: Player, b: Player): boolean {
    return (
      (!a.preferences.difficulty ||
        a.preferences.difficulty === b.preferences.difficulty) &&
      (!a.preferences.type || a.preferences.type === b.preferences.type)
    );
  }
}
