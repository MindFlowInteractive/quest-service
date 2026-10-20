import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './category.service';
import { Category } from './entities/category.entity';
import { Puzzle } from './entities/puzzle.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  const categories = new Map<string, Category>();
  const repository = {
    create: jest.fn((data) => data),
    save: jest.fn(async (category) => category),
    find: jest.fn(async () => [...categories.values()]),
    findOne: jest.fn(async ({ where }) => categories.get(where.id) ?? null),
    delete: jest.fn(async () => ({ affected: 1 })),
    createQueryBuilder: jest.fn(() => {
      const query = {
        leftJoin: jest.fn(() => query), select: jest.fn(() => query),
        addSelect: jest.fn(() => query), groupBy: jest.fn(() => query),
        addGroupBy: jest.fn(() => query), orderBy: jest.fn(() => query),
        getRawMany: jest.fn(async () => []),
      };
      return query;
    }),
  };

  beforeEach(async () => {
    categories.clear();
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: repository },
        { provide: getRepositoryToken(Puzzle), useValue: {} },
      ],
    }).compile();
    service = module.get(CategoriesService);
  });

  it('creates a category beneath its selected parent', async () => {
    const parent = { id: 'parent', name: 'Logic' } as Category;
    categories.set(parent.id, parent);
    await service.create({ name: 'Deduction', parentCategoryId: parent.id });
    expect(repository.create).toHaveBeenCalledWith({ name: 'Deduction', parentCategory: parent });
  });

  it('rejects hierarchy cycles', async () => {
    const child = { id: 'child', parentCategory: { id: 'root' } } as Category;
    const root = { id: 'root', parentCategory: null } as Category;
    categories.set('child', child);
    categories.set('root', root);
    await expect(service.update('root', { parentCategoryId: 'child' })).rejects.toThrow(
      'Category hierarchy cannot contain cycles',
    );
  });

  it('returns category popularity metrics', async () => {
    const metrics = [{ id: 'root', name: 'Logic', puzzleCount: '4', attempts: '20', completions: '12' }];
    repository.createQueryBuilder.mockReturnValueOnce({
      leftJoin: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(), groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(metrics),
    });
    await expect(service.analytics()).resolves.toEqual([
      { ...metrics[0], puzzleCount: 4, attempts: 20, completions: 12 },
    ]);
  });
});
