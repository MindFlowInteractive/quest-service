import { Injectable } from '@nestjs/common';
import { WaitingQueueService } from './queue/waiting-queue.service';
import { Match } from './entities/match.entity';
import { Player } from './entities/player.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class MatchmakingService {
  constructor(private queue: WaitingQueueService) {}

  joinQueue(player: Player): Match | null {
    this.queue.addPlayer(player);

    const matchedPlayers = this.queue.findMatch();
    if (!matchedPlayers) return null;

    return {
      id: randomUUID(),
      players: matchedPlayers,
      createdAt: Date.now(),
    };
  }
}
