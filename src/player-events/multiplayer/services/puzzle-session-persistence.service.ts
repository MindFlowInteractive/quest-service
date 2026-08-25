import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleSessionEvent } from '../entities/puzzle-session-event.entity';
import { PuzzleSessionEventType } from '../enums/puzzle-session-event.enum';

@Injectable()
export class PuzzleSessionPersistenceService {
  constructor(
    @InjectRepository(PuzzleSessionEvent)
    private readonly eventRepository: Repository<PuzzleSessionEvent>,
  ) {}

  async recordEvent(
    sessionId: string,
    type: PuzzleSessionEventType,
    userId?: string,
    payload?: Record<string, unknown>,
  ) {
    return this.eventRepository.save(
      this.eventRepository.create({
        sessionId,
        userId: userId ?? null,
        type,
        payload: payload ?? null,
      }),
    );
  }

  async history(sessionId: string, limit = 50, offset = 0) {
    return this.eventRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
