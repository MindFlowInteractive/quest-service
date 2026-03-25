import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { Spectator } from './entities/spectator.entity';
import { GameSessionService } from './services/game-session.service';
import { SpectatorService } from './services/spectator.service';
import { CleanupSessionJob } from './services/cleanup-session.job';
import { AutosaveSessionJob } from './services/autosave-session.job';
import { GameSessionController } from './controllers/game-session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession, Spectator])],
  controllers: [GameSessionController],
  providers: [
    GameSessionService,
    SpectatorService,
    CleanupSessionJob,
    AutosaveSessionJob,
  ],
})
export class GameSessionModule {}
