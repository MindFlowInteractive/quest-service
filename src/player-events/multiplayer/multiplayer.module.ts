import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleSession } from './entities/puzzle-session.entity';
import { PuzzleSessionPlayer } from './entities/puzzle-session-player.entity';
import { PuzzleSessionEvent } from './entities/puzzle-session-event.entity';
import { PuzzleSessionSolution } from './entities/puzzle-session-solution.entity';
import { PuzzleSessionsController } from './controllers/puzzle-sessions.controller';
import { PuzzleSessionsGateway } from './gateways/puzzle-sessions.gateway';
import { PuzzleSessionService } from './services/puzzle-session.service';
import { PuzzleSessionStateService } from './services/puzzle-session-state.service';
import { PuzzleSessionPlayerService } from './services/puzzle-session-player.service';
import { PuzzleSessionPersistenceService } from './services/puzzle-session-persistence.service';
import { PuzzleSessionTimeoutService } from './services/puzzle-session-timeout.service';
import { PuzzleSessionAnalyticsService } from './services/puzzle-session-analytics.service';
import { PuzzleSessionTimeoutProcessor } from './processors/puzzle-session-timeout.processor';

export const PUZZLE_SESSION_TIMEOUT_QUEUE = 'puzzle-session-timeouts';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PuzzleSession,
      PuzzleSessionPlayer,
      PuzzleSessionEvent,
      PuzzleSessionSolution,
    ]),
    BullModule.registerQueue({ name: PUZZLE_SESSION_TIMEOUT_QUEUE }),
  ],
  controllers: [PuzzleSessionsController],
  providers: [
    PuzzleSessionsGateway,
    PuzzleSessionService,
    PuzzleSessionStateService,
    PuzzleSessionPlayerService,
    PuzzleSessionPersistenceService,
    PuzzleSessionTimeoutService,
    PuzzleSessionAnalyticsService,
    PuzzleSessionTimeoutProcessor,
  ],
  exports: [PuzzleSessionService],
})
export class MultiplayerModule {}
