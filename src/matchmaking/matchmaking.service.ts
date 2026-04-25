// matchmaking.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MatchmakingQueue } from './matchmaking-queue.entity';

@Injectable()
export class MatchmakingService {
  constructor(private readonly repo: Repository<MatchmakingQueue>) {}

  async joinQueue(playerId: string, puzzleType: string, rating: number) {
    const entry = this.repo.create({ playerId, puzzleType, rating });
    return this.repo.save(entry);
  }

  async leaveQueue(playerId: string) {
    await this.repo.update({ playerId, status: 'waiting' }, { status: 'cancelled' });
  }

  async getStatus(playerId: string) {
    const entry = await this.repo.findOne({ where: { playerId, status: 'waiting' } });
    if (!entry) return { position: null, estimatedWait: null };
    const all = await this.repo.find({ where: { puzzleType: entry.puzzleType, status: 'waiting' }, order: { joinedAt: 'ASC' } });
    const position = all.findIndex(e => e.playerId === playerId) + 1;
    return { position, estimatedWait: position * 30 };
  }

  async getHistory(playerId: string) {
    // query GameSession table for past matches
  }

  async pairPlayers() {
    const waiting = await this.repo.find({ where: { status: 'waiting' } });
    for (let i = 0; i < waiting.length; i++) {
      const p1 = waiting[i];
      const window = 50 + Math.floor((Date.now() - p1.joinedAt.getTime()) / 30000) * 25;
      const opponent = waiting.find(p2 => p2.playerId !== p1.playerId && p2.puzzleType === p1.puzzleType && Math.abs(p1.rating - p2.rating) <= window);
      if (opponent) {
        // create GameSession
        await this.repo.update({ id: p1.id }, { status: 'matched' });
        await this.repo.update({ id: opponent.id }, { status: 'matched' });
        // emit WebSocket event
      }
    }
  }

  async handleDisconnect(playerId: string) {
    // if opponent disconnects before game starts, re-queue player
    await this.repo.update({ playerId }, { status: 'waiting', joinedAt: new Date() });
  }
}
