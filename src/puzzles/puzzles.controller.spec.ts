import { Test, TestingModule } from '@nestjs/testing';
import { PuzzlesController } from './puzzles.controller';
import { PuzzlesService } from './puzzles.service';

describe('PuzzlesController', () => {
  let controller: PuzzlesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzlesController],
      providers: [PuzzlesService],
    }).compile();

    controller = module.get<PuzzlesController>(PuzzlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
