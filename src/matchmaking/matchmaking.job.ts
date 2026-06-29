// matchmaking.job.ts
import { Injectable } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

@Injectable()
export class MatchmakingJob {
  constructor(private readonly service: MatchmakingService) {}

  async run() {
    await this.service.pairPlayers();
  }
}
