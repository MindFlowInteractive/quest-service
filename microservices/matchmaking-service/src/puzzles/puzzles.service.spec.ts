import { Test, TestingModule } from '@nestjs/testing';
import { PuzzlesService } from './puzzles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleProgress } from '../game-logic/entities/puzzle-progress.entity';
import { PuzzleRating } from './entities/puzzle-rating.entity';

describe('PuzzlesService', () => {
  let service: PuzzlesService;

  const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getOne: jest.fn().mockResolvedValue(null),
      getCount: jest.fn().mockResolvedValue(0),
      clone: jest.fn().mockReturnThis(),
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzlesService,
        { provide: getRepositoryToken(Puzzle), useFactory: mockRepository },
        { provide: getRepositoryToken(PuzzleProgress), useFactory: mockRepository },
        { provide: getRepositoryToken(PuzzleRating), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<PuzzlesService>(PuzzlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
