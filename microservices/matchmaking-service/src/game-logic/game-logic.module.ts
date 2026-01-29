import { Module } from '@nestjs/common';
import { GameLogicService } from './game-logic.service';
import { GameLogicController } from './game-logic.controller';

@Module({
  controllers: [GameLogicController],
  providers: [GameLogicService],
})
export class GameLogicModule {}
