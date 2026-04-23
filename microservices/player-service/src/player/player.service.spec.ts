import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlayerService } from './player.service';
import { Player } from './entities/player.entity';
import { PlayerProfile } from './entities/player-profile.entity';
import { PlayerProgress } from './entities/player-progress.entity';

const mockPlayerRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

const mockProfileRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockProgressRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ totalProgress: '5', totalPoints: '100' }),
  })),
};

describe('PlayerService', () => {
  let service: PlayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        {
          provide: getRepositoryToken(Player),
          useValue: mockPlayerRepository,
        },
        {
          provide: getRepositoryToken(PlayerProfile),
          useValue: mockProfileRepository,
        },
        {
          provide: getRepositoryToken(PlayerProgress),
          useValue: mockProgressRepository,
        },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});