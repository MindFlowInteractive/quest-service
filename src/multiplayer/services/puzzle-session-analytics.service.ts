import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSessionEvent } from '../entities/puzzle-session-event.entity';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';
import { PuzzleSessionPlayer } from '../entities/puzzle-session-player.entity';

@Injectable()
export class PuzzleSessionAnalyticsService {
  constructor(
    @InjectRepository(PuzzleSessionEvent)
    private readonly eventRepository: Repository<PuzzleSessionEvent>,
    @InjectRepository(PuzzleSessionPlayer)
    private readonly playerRepository: Repository<PuzzleSessionPlayer>,
  ) {}

  async get(sessionId: string) {
    const events = await this.eventRepository.find({ where: { sessionId } });
    const players = await this.playerRepository.find({ where: { sessionId } });

    const created = events.find(e => e.type === PuzzleSessionEventType.SESSION_CREATED);
    const completed = events.find(e => e.type === PuzzleSessionEventType.PUZZLE_COMPLETED);

    return {
      sessionId,
      playerCount: players.length,
      peakPlayers: Math.min(
        players.length,
        events.filter(e => e.type === PuzzleSessionEventType.PLAYER_JOINED).length,
      ),
      solutionsSubmitted: events.filter(
        e => e.type === PuzzleSessionEventType.SOLUTION_SUBMITTED,
      ).length,
      partialSolutions: events.filter(
        e => e.type === PuzzleSessionEventType.PARTIAL_SOLUTION_UPDATED,
      ).length,
      disconnects: events.filter(
        e => e.type === PuzzleSessionEventType.PLAYER_DISCONNECTED,
      ).length,
      reconnects: events.filter(
        e => e.type === PuzzleSessionEventType.PLAYER_RECONNECTED,
      ).length,
      completed: Boolean(completed),
      durationSeconds:
        created && completed
          ? Math.max(
              0,
              Math.floor(
                (completed.createdAt.getTime() - created.createdAt.getTime()) / 1000,
              ),
            )
          : null,
    };
  }
}
