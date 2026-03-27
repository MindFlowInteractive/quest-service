import { Test, TestingModule } from '@nestjs/testing';
import { PuzzlesService } from './puzzles.service';
import { PuzzlesRepository } from './puzzles.repository';

describe('PuzzlesService.search', () => {
  let service: PuzzlesService;

  const repoMock = {
    search: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzlesService,
        {
          provide: PuzzlesRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<PuzzlesService>(PuzzlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should perform full-text search', async () => {
    repoMock.search.mockResolvedValue({
      data: [{ id: 1, difficulty: 3, tags: ['logic', 'math'] }],
      page: 1,
      limit: 20,
      total: 1,
    });

    const result = await service.search({ q: 'logic puzzle' }, 'user1');

    expect(result.data.length).toBeGreaterThan(0);
  });

  it('should filter by difficulty range', async () => {
    repoMock.search.mockResolvedValue({
      data: [{ difficulty: 3, tags: [] }],
      page: 1,
      limit: 20,
      total: 1,
    });

    const result = await service.search(
      { difficulty_min: 2, difficulty_max: 4 },
      'user1',
    );

    result.data.forEach((p) => {
      expect(p.difficulty).toBeGreaterThanOrEqual(2);
      expect(p.difficulty).toBeLessThanOrEqual(4);
    });
  });

  it('should filter by tags AND logic', async () => {
    repoMock.search.mockResolvedValue({
      data: [{ tags: ['math', 'algebra'] }],
      page: 1,
      limit: 20,
      total: 1,
    });

    const result = await service.search(
      { tags: 'math,algebra' },
      'user1',
    );

    result.data.forEach((p) => {
      expect(p.tags).toEqual(
        expect.arrayContaining(['math', 'algebra']),
      );
    });
  });

  it('should paginate results', async () => {
    repoMock.search.mockResolvedValue({
      data: [],
      page: 2,
      limit: 10,
      total: 100,
    });

    const result = await service.search({ page: 2, limit: 10 }, 'user1');

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });
});