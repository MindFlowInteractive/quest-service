import { Test, TestingModule } from '@nestjs/testing';
import { GameLogicController } from './game-logic.controller';
import { GameLogicService } from './game-logic.service';

describe('GameLogicController', () => {
  let controller: GameLogicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameLogicController],
      providers: [GameLogicService],
    }).compile();

    controller = module.get<GameLogicController>(GameLogicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
