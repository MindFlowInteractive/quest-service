import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlayerActionEvent, PlayerActionEventType } from './entities/player-action-event.entity';
import { CreatePlayerActionEventDto } from './dto/player-action-event.dto';

@Injectable()
export class PlayerEventsService {
  private readonly logger = new Logger(PlayerEventsService.name);
  private readonly queue: PlayerActionEvent[] = [];
  private isProcessing = false;

  constructor(
    @InjectRepository(PlayerActionEvent)
    private readonly playerActionEventRepository: Repository<PlayerActionEvent>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async emitPlayerEvent(createDto: CreatePlayerActionEventDto): Promise<PlayerActionEvent> {
    this.validatePayload(createDto.eventType, createDto.payload);

    const event = this.playerActionEventRepository.create({
      userId: createDto.userId,
      sessionId: createDto.sessionId || null,
      eventType: createDto.eventType,
      payload: createDto.payload,
    });

    // Push for asynchronous persistence
    this.enqueue(event);

    // Publish immediately on internal event bus
    this.eventEmitter.emit(createDto.eventType, {
      userId: createDto.userId,
      sessionId: createDto.sessionId,
      payload: createDto.payload,
      timestamp: new Date(),
    });

    return event;
  }

  private enqueue(event: PlayerActionEvent) {
    this.queue.push(event);
    if (!this.isProcessing) {
      this.isProcessing = true;
      setImmediate(() => void this.processQueue());
    }
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) continue;
      try {
        await this.playerActionEventRepository.save(item);
      } catch (error) {
        this.logger.error('Failed to persist PlayerActionEvent', error as any);
      }
    }
    this.isProcessing = false;
  }

  async getEventsByPlayer(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.playerActionEventRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEventsBySession(sessionId: string, page = 1, limit = 50) {
    const [items, total] = await this.playerActionEventRepository.findAndCount({
      where: { sessionId },
      order: { timestamp: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async computeAggregatesForPlayer(userId: string) {
    const events = await this.playerActionEventRepository.find({ where: { userId } });

    const aggregates = {
      totalHintsUsed: 0,
      totalSolves: 0,
      totalAbandoned: 0,
      totalAnswerSubmissions: 0,
      totalSolveTimeSeconds: 0,
    };

    for (const ev of events) {
      switch (ev.eventType) {
        case 'hint.used': {
          aggregates.totalHintsUsed += Number(ev.payload?.count ?? 1);
          break;
        }
        case 'puzzle.solved': {
          aggregates.totalSolves += 1;
          aggregates.totalSolveTimeSeconds += Number(ev.payload?.solveTimeSeconds ?? 0);
          break;
        }
        case 'puzzle.abandoned': {
          aggregates.totalAbandoned += 1;
          break;
        }
        case 'answer.submitted': {
          aggregates.totalAnswerSubmissions += 1;
          break;
        }
      }
    }

    return aggregates;
  }

  private validatePayload(eventType: PlayerActionEventType, payload: Record<string, any>) {
    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Payload must be a JSON object');
    }

    switch (eventType) {
      case 'puzzle.started':
        if (!payload.puzzleId || !payload.startedAt) {
          throw new BadRequestException('payload must include puzzleId and startedAt');
        }
        break;
      case 'puzzle.solved':
        if (!payload.puzzleId || payload.solveTimeSeconds == null) {
          throw new BadRequestException('payload must include puzzleId and solveTimeSeconds');
        }
        break;
      case 'puzzle.abandoned':
        if (!payload.puzzleId || !payload.reason) {
          throw new BadRequestException('payload must include puzzleId and reason');
        }
        break;
      case 'hint.used':
        if (!payload.puzzleId || !payload.hintId) {
          throw new BadRequestException('payload must include puzzleId and hintId');
        }
        break;
      case 'answer.submitted':
        if (!payload.puzzleId || payload.correct == null) {
          throw new BadRequestException('payload must include puzzleId and correct');
        }
        break;
      case 'achievement.unlocked':
        if (!payload.achievementId) {
          throw new BadRequestException('payload must include achievementId');
        }
        break;
      default:
        throw new BadRequestException('Unknown event type');
    }
  }
}
