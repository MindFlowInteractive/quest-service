import { Module } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import { WaitingQueueService } from './queue/waiting-queue.service';
import { MatchmakingGateway } from './gateway/matchmaking.gateway';

@Module({
  providers: [
    MatchmakingService,
    WaitingQueueService,
    MatchmakingGateway,
  ],
})
export class MatchmakingModule {}
