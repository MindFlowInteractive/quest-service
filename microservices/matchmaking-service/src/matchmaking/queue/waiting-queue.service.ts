import { Injectable } from '@nestjs/common';
import { Player } from '../entities/player.entity';

@Injectable()
export class WaitingQueueService {
  private queue: Player[] = [];
  private readonly TIMEOUT_MS = 30_000;

  addPlayer(player: Player) {
    this.queue = this.queue.filter(p => p.id !== player.id);
    this.queue.push({ ...player, joinedAt: Date.now() });
  }

  removePlayer(playerId: string) {
    this.queue = this.queue.filter(p => p.id !== playerId);
  }

  cleanupIdlePlayers() {
    const now = Date.now();
    this.queue = this.queue.filter(p => now - (p.joinedAt ?? 0) < this.TIMEOUT_MS);
  }

  findMatch(): Player[] | null {
    this.cleanupIdlePlayers();

    if (this.queue.length < 2) return null;

    this.queue.sort((a, b) => a.elo - b.elo);

    for (let i = 0; i < this.queue.length - 1; i++) {
      const p1 = this.queue[i];
      const p2 = this.queue[i + 1];

      if (this.preferencesMatch(p1, p2)) {
        this.queue.splice(i, 2);
        return [p1, p2];
      }
    }

    return null;
  }

  private preferencesMatch(a: Player, b: Player): boolean {
    if (a.preferences?.difficulty && b.preferences?.difficulty) {
      if (a.preferences.difficulty !== b.preferences.difficulty) return false;
    }

    if (a.preferences?.type && b.preferences?.type) {
      if (a.preferences.type !== b.preferences.type) return false;
    }

    return true;
  }
}
