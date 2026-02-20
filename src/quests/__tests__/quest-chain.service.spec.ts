import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { QuestChainService } from '../services/quest-chain.service';
import { QuestChain } from '../entities/quest-chain.entity';
import { QuestChainPuzzle } from '../entities/quest-chain-puzzle.entity';
import { CreateQuestChainDto } from '../dto/create-quest-chain.dto';

describe('QuestChainService', () => {
  let service: QuestChainService;
  let questChainRepository: Repository<QuestChain>;
  let questChainPuzzleRepository: Repository<QuestChainPuzzle>;

  const mockQuestChainRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
    remove: jest.fn(),
  };

  const mockQuestChainPuzzleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestChainService,
        {
          provide: getRepositoryToken(QuestChain),
          useValue: mockQuestChainRepository,
        },
        {
          provide: getRepositoryToken(QuestChainPuzzle),
          useValue: mockQuestChainPuzzleRepository,
        },
      ],
    }).compile();

    service = module.get<QuestChainService>(QuestChainService);
    questChainRepository = module.get<Repository<QuestChain>>(
      getRepositoryToken(QuestChain),
    );
    questChainPuzzleRepository = module.get<Repository<QuestChainPuzzle>>(
      getRepositoryToken(QuestChainPuzzle),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createChain', () => {
    it('should create a new quest chain', async () => {
      const createDto: CreateQuestChainDto = {
        name: 'Test Chain',
        description: 'Test Description',
        story: {
          intro: 'Intro text',
          outro: 'Outro text',
          chapters: [
            {
              id: 'chapter1',
              title: 'Chapter 1',
              description: 'Chapter 1 description',
              storyText: 'Chapter 1 text',
            },
          ],
        },
        rewards: {
          completion: {
            xp: 100,
            coins: 50,
            items: ['item1'],
          },
          milestones: [],
        },
      };

      const mockChain = {
        id: uuidv4(),
        ...createDto,
        status: 'active',
        completionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQuestChainRepository.create.mockReturnValue(mockChain);
      mockQuestChainRepository.save.mockResolvedValue(mockChain);

      const result = await service.createChain(createDto);

      expect(result).toEqual(mockChain);
      expect(questChainRepository.create).toHaveBeenCalledWith({
        ...createDto,
        id: expect.any(String),
      });
      expect(questChainRepository.save).toHaveBeenCalledWith(mockChain);
    });
  });

  describe('getChainById', () => {
    it('should return a quest chain by ID', async () => {
      const chainId = uuidv4();
      const mockChain = {
        id: chainId,
        name: 'Test Chain',
        description: 'Test Description',
        status: 'active',
      };

      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);

      const result = await service.getChainById(chainId);

      expect(result).toEqual(mockChain);
      expect(questChainRepository.findOne).toHaveBeenCalledWith({
        where: { id: chainId },
        relations: ['chainPuzzles', 'chainPuzzles.puzzle'],
      });
    });

    it('should throw NotFoundException when chain not found', async () => {
      const chainId = uuidv4();
      mockQuestChainRepository.findOne.mockResolvedValue(null);

      await expect(service.getChainById(chainId)).rejects.toThrow(
        `Quest chain with ID ${chainId} not found`,
      );
    });
  });

  describe('addPuzzleToChain', () => {
    it('should add a puzzle to a quest chain', async () => {
      const chainId = uuidv4();
      const puzzleId = uuidv4();
      
      const mockChain = { id: chainId, name: 'Test Chain' };
      const mockChainPuzzle = {
        id: uuidv4(),
        questChainId: chainId,
        puzzleId,
        sequenceOrder: 1,
      };

      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.findOne.mockResolvedValue(null);
      mockQuestChainPuzzleRepository.create.mockReturnValue(mockChainPuzzle);
      mockQuestChainPuzzleRepository.save.mockResolvedValue(mockChainPuzzle);

      const result = await service.addPuzzleToChain(chainId, {
        puzzleId,
        sequenceOrder: 1,
      });

      expect(result).toEqual(mockChainPuzzle);
      expect(questChainPuzzleRepository.create).toHaveBeenCalledWith({
        puzzleId,
        sequenceOrder: 1,
        questChainId: chainId,
        id: expect.any(String),
      });
    });

    it('should throw BadRequestException when puzzle already exists in chain', async () => {
      const chainId = uuidv4();
      const puzzleId = uuidv4();
      
      const mockChain = { id: chainId, name: 'Test Chain' };
      const existingChainPuzzle = { id: uuidv4(), puzzleId };

      mockQuestChainRepository.findOne.mockResolvedValue(mockChain);
      mockQuestChainPuzzleRepository.findOne.mockResolvedValue(existingChainPuzzle);

      await expect(
        service.addPuzzleToChain(chainId, {
          puzzleId,
          sequenceOrder: 1,
        }),
      ).rejects.toThrow('Puzzle already exists in this quest chain');
    });
  });
});