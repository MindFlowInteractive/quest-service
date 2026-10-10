import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from '../category.service';
import { TagsService } from '../tags.service';
import { Category } from '../entities/category.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { Tag } from '../entities/tag.entity';
import { DataSource } from 'typeorm';

describe('Puzzle Categorization and Tag System', () => {
  let categoriesService: CategoriesService;
  let tagsService: TagsService;
  let categoryRepo: jest.Mocked<Repository<Category>>;
  let puzzleRepo: jest.Mocked<Repository<Puzzle>>;
  let tagRepo: jest.Mocked<Repository<Tag>>;

  const mockCategory = (overrides: Partial<Category> = {}): Category =>
    ({
      id: 'cat-uuid-1',
      name: 'Logic Puzzles',
      slug: 'logic-puzzles',
      description: 'Puzzles that test deductive logic',
      icon: 'brain-icon',
      displayOrder: 1,
      isActive: true,
      parentId: null,
      children: [],
      puzzles: [],
      collections: [],
      ...overrides,
    } as unknown as Category);

  const mockPuzzle = (overrides: Partial<Puzzle> = {}): Puzzle =>
    ({
      id: 'puzzle-uuid-1',
      title: 'Sudoku Master',
      description: 'Classic 9x9 logic grid',
      difficulty: 'medium',
      completions: 25,
      averageRating: 4.8,
      categories: [],
      tagEntities: [],
      ...overrides,
    } as unknown as Puzzle);

  const mockTag = (overrides: Partial<Tag> = {}): Tag =>
    ({
      id: 'tag-uuid-1',
      name: 'logic',
      usageCount: 42,
      createdAt: new Date(),
      updatedAt: new Date(),
      puzzles: [],
      ...overrides,
    } as unknown as Tag);

  beforeEach(async () => {
    const mockCategoryRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((cat) => Promise.resolve({ id: 'cat-uuid-new', ...cat })),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockPuzzleRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTagRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((t) => Promise.resolve({ id: 'tag-new', ...t })),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          increment: jest.fn(),
          decrement: jest.fn(),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        TagsService,
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(Puzzle), useValue: mockPuzzleRepo },
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    categoriesService = module.get<CategoriesService>(CategoriesService);
    tagsService = module.get<TagsService>(TagsService);
    categoryRepo = module.get(getRepositoryToken(Category));
    puzzleRepo = module.get(getRepositoryToken(Puzzle));
    tagRepo = module.get(getRepositoryToken(Tag));
  });

  describe('CategoriesService Hierarchy & Management', () => {
    it('creates category and automatically generates normalized slug', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      const result = await categoriesService.create({
        name: 'Pattern Recognition',
        description: 'Visual pattern tests',
      });

      expect(categoryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pattern Recognition',
          slug: 'pattern-recognition',
          displayOrder: 0,
          isActive: true,
        }),
      );
      expect(result.name).toBe('Pattern Recognition');
    });

    it('validates parentId when creating child category', async () => {
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        categoriesService.create({
          name: 'Binary Logic',
          parentId: 'non-existent-parent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('prevents self-referencing parentId on category update', async () => {
      const cat = mockCategory({ id: 'cat-1' });
      categoryRepo.findOne.mockResolvedValue(cat);

      await expect(
        categoriesService.update('cat-1', { parentId: 'cat-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('builds full category hierarchy tree correctly', async () => {
      const root1 = mockCategory({ id: 'root-1', name: 'Mathematics', parentId: null });
      const child1 = mockCategory({ id: 'child-1', name: 'Algebra', parentId: 'root-1' });
      const child2 = mockCategory({ id: 'child-2', name: 'Geometry', parentId: 'root-1' });
      const root2 = mockCategory({ id: 'root-2', name: 'Word Games', parentId: null });

      categoryRepo.find.mockResolvedValue([root1, child1, child2, root2]);

      const hierarchy = await categoriesService.getHierarchy();

      expect(hierarchy.length).toBe(2);
      expect(hierarchy[0].id).toBe('root-1');
      expect(hierarchy[0].children.length).toBe(2);
      expect(hierarchy[0].children[0].id).toBe('child-1');
      expect(hierarchy[0].children[1].id).toBe('child-2');
      expect(hierarchy[1].id).toBe('root-2');
      expect(hierarchy[1].children.length).toBe(0);
    });

    it('calculates category analytics and popularity score accurately', async () => {
      const puzzle1 = mockPuzzle({
        difficulty: 'easy',
        completions: 10,
        averageRating: 4.0,
      });
      const puzzle2 = mockPuzzle({
        difficulty: 'hard',
        completions: 30,
        averageRating: 5.0,
      });
      const cat = mockCategory({
        id: 'cat-logic',
        name: 'Logic',
        puzzles: [puzzle1, puzzle2],
      });

      categoryRepo.findOne.mockResolvedValue(cat);

      const [analytics] = await categoriesService.getCategoryAnalytics('cat-logic');

      expect(analytics.categoryId).toBe('cat-logic');
      expect(analytics.totalPuzzles).toBe(2);
      expect(analytics.totalCompletions).toBe(40);
      expect(analytics.averageRating).toBe(4.5);
      expect(analytics.difficultyBreakdown).toEqual({
        easy: 1,
        medium: 0,
        hard: 1,
        expert: 0,
      });
      // Popularity formula: 40 * 2 + 2 * 5 + 4.5 * 10 = 80 + 10 + 45 = 135
      expect(analytics.popularityScore).toBe(135);
    });

    it('ranks category recommendations by popularity score', async () => {
      const catA = mockCategory({
        id: 'cat-a',
        name: 'High Pop',
        puzzles: [mockPuzzle({ completions: 100, averageRating: 5.0 })],
      });
      const catB = mockCategory({
        id: 'cat-b',
        name: 'Low Pop',
        puzzles: [mockPuzzle({ completions: 2, averageRating: 3.0 })],
      });

      categoryRepo.find.mockResolvedValue([catB, catA]);

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([catA, catB]),
      };
      categoryRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      const recommendations = await categoriesService.getRecommendations(2);

      expect(recommendations.length).toBe(2);
      expect(recommendations[0].id).toBe('cat-a');
      expect(recommendations[1].id).toBe('cat-b');
    });
  });

  describe('TagsService Multi-Tags & Trending', () => {
    it('retrieves trending tags ordered by usageCount DESC', async () => {
      const tag1 = mockTag({ name: 'cryptography', usageCount: 150 });
      const tag2 = mockTag({ name: 'algorithms', usageCount: 85 });

      tagRepo.find.mockResolvedValue([tag1, tag2]);

      const trending = await tagsService.getTrendingTags(10);

      expect(tagRepo.find).toHaveBeenCalledWith({
        order: { usageCount: 'DESC', name: 'ASC' },
        take: 10,
      });
      expect(trending).toEqual([tag1, tag2]);
      expect(trending[0].usageCount).toBe(150);
    });

    it('recommends related tags excluding provided seed tags', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTag({ name: 'sorting' })]),
      };
      tagRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      const recommended = await tagsService.getRecommendedTags(['logic', 'math'], 5);

      expect(mockQb.where).toHaveBeenCalledWith('tag.name NOT IN (:...normalised)', {
        normalised: ['logic', 'math'],
      });
      expect(recommended.length).toBe(1);
    });

    it('filters puzzles by multiple tags', async () => {
      const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPuzzle()]),
      };
      puzzleRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      const results = await tagsService.filterPuzzlesByMultiTags(
        ['logic', 'math'],
        true,
      );

      expect(mockQb.where).toHaveBeenCalledWith('tag.name IN (:...tags)', {
        tags: ['logic', 'math'],
      });
      expect(mockQb.having).toHaveBeenCalledWith('COUNT(DISTINCT tag.id) >= :count', {
        count: 2,
      });
      expect(results.length).toBe(1);
    });
  });
});
