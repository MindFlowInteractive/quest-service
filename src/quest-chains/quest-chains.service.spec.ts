import { Test, TestingModule } from '@nestjs/testing';
import { QuestChainsService } from './quest-chains.service';
import { PrismaService } from '../prisma/prisma.service';

describe('QuestChainsService', () => {
  let service: QuestChainsService;
  let prisma: PrismaService;

  const prismaMock = {
    questChain: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    userQuestChainProgress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestChainsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<QuestChainsService>(QuestChainsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should unlock entries sequentially', async () => {
    const chain = {
      id: 'chain1',
      entries: [
        { id: 'e1', order: 0, unlockCondition: 'none' },
        { id: 'e2', order: 1, unlockCondition: 'previous_completed' },
      ],
    };

    prismaMock.questChain.findUnique.mockResolvedValue(chain);
    prismaMock.userQuestChainProgress.findUnique.mockResolvedValue({
      userId: 'user1',
      chainId: 'chain1',
      completedEntries: ['e1'],
    });

    const result = await service.getChainDetail('chain1', 'user1');

    expect(result[0].unlocked).toBe(true);
    expect(result[1].unlocked).toBe(true); // sequential unlock
  });

  it('should reject duplicate completion', async () => {
    prismaMock.userQuestChainProgress.upsert.mockResolvedValue({
      userId: 'user1',
      chainId: 'chain1',
      completedEntries: ['e1'],
    });

    prismaMock.questChain.findUnique.mockResolvedValue({
      id: 'chain1',
      entries: [{ id: 'e1' }, { id: 'e2' }],
    });

    const result = await service.markEntryCompleted(
      'user1',
      'chain1',
      'e1',
    );

    expect(result.completedEntries.filter((e) => e === 'e1').length).toBe(1);
  });

  it('should trigger achievement on chain completion', async () => {
    const emitSpy = jest
      .spyOn<any, any>(service as any, 'emitChainCompleted')
      .mockResolvedValue(undefined);

    prismaMock.userQuestChainProgress.upsert.mockResolvedValue({
      userId: 'user1',
      chainId: 'chain1',
      completedEntries: ['e1', 'e2'],
    });

    prismaMock.questChain.findUnique.mockResolvedValue({
      id: 'chain1',
      entries: [{ id: 'e1' }, { id: 'e2' }],
    });

    await service.markEntryCompleted('user1', 'chain1', 'e2');

    expect(emitSpy).toHaveBeenCalledWith('user1', 'chain1');
  });
});