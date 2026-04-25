// session-replay.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SessionEvent } from './session-event.entity';

const MIN_SOLVE_TIME = {
  easy: 10, // seconds
  medium: 30,
  hard: 60,
};

@Injectable()
export class SessionReplayService {
  constructor(private readonly repo: Repository<SessionEvent>) {}

  async recordEvent(event: Partial<SessionEvent>) {
    // push to queue for async persistence
    // queue worker will call repo.save(event)
  }

  async getReplay(sessionId: string, userId: string, isAdmin: boolean) {
    // check ownership or admin
    const events = await this.repo.find({
      where: { sessionId, softDeleted: false },
      order: { sequence: 'ASC' },
    });
    return events;
  }

  async getSummary(sessionId: string) {
    const events = await this.repo.find({ where: { sessionId, softDeleted: false } });
    const totalMoves = events.filter(e => e.eventType === 'move').length;
    const hintsUsed = events.filter(e => e.eventType === 'hint').length;
    const pauses = events.filter(e => e.eventType === 'pause').length;
    const totalTime = this.calculateTotalTime(events);

    return { totalMoves, hintsUsed, pauses, totalTime };
  }

  calculateTotalTime(events: SessionEvent[]): number {
    const start = events[0]?.timestamp;
    const end = events[events.length - 1]?.timestamp;
    return start && end ? (end.getTime() - start.getTime()) / 1000 : 0;
  }

  async flagSuspiciousSessions(difficulty: 'easy' | 'medium' | 'hard') {
    const sessions = await this.repo.query(/* aggregate sessions */);
    return sessions.filter(s => s.totalTime < MIN_SOLVE_TIME[difficulty]);
  }

  async applyRetentionTTL() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    await this.repo.update({ timestamp: cutoff }, { softDeleted: true });
  }
}
