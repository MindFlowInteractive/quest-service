import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { GameSessionService } from './services/game-session.service';
import { CleanupSessionJob } from './services/cleanup-session.job';
import { AutosaveSessionJob } from './services/autosave-session.job';
import { GameSessionController } from './controllers/game-session.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GameSession])],
  controllers: [GameSessionController],
  providers: [
    GameSessionService,
    CleanupSessionJob,
    AutosaveSessionJob,
  ],
})
export class GameSessionModule {}
