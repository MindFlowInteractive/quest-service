import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEventsService } from './player-events.service';
import { PlayerEventsController } from './player-events.controller';
import { PlayerActionEvent } from './entities/player-action-event.entity';
import { GameSession } from '../game-session/entities/game-session.entity';
import { GameSessionModule } from '../game-session/game-session.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlayerActionEvent, GameSession]), forwardRef(() => GameSessionModule)],
  controllers: [PlayerEventsController],
  providers: [PlayerEventsService],
  exports: [PlayerEventsService],
})
export class PlayerEventsModule {}
