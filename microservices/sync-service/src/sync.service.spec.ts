import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncState } from './sync.entity';

describe('SyncService', () => {
  let service: SyncService;
  const existing = { id: 'uuid', userId: 'u1', deviceId: 'd1', data: { level: 1 }, updatedAt: new Date() };
  const mockRepo = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'uuid', ...d })),
    findOneBy: jest.fn(() => Promise.resolve(null)),
    findBy: jest.fn(() => Promise.resolve([])),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: getRepositoryToken(SyncState), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(SyncService);
  });

  it('creates new sync state', async () => {
    const result = await service.upsert('u1', 'd1', { level: 5 });
    expect(result).toBeDefined();
  });

  it('merges data on conflict', async () => {
    mockRepo.findOneBy.mockResolvedValueOnce({ ...existing });
    const result = await service.upsert('u1', 'd1', { score: 100 });
    expect(result).toBeDefined();
  });
});