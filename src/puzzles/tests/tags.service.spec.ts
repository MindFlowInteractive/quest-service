import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TagsService } from '../tags.service';
import { Tag } from '../entities/tag.entity';
import { Puzzle } from '../entities/puzzle.entity';
import { TagSortBy, TagSortOrder } from '../dto/tag.dto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockTag = (overrides: Partial<Tag> = {}): Tag =>
  ({
    id: 'tag-uuid-1',
    name: 'logic',
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    puzzles: [],
    ...overrides,
  } as Tag);

const mockPuzzle = (overrides: Partial<Puzzle> = {}): Puzzle =>
  ({
    id: 'puzzle-uuid-1',
    title: 'Test Puzzle',
    tagEntities: [],
    ...overrides,
  } as unknown as Puzzle);

// ---------------------------------------------------------------------------
// QueryRunner mock factory
// ---------------------------------------------------------------------------

const buildQueryRunner = (overrides: Record<string, jest.Mock> = {}) => ({
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
  ...overrides,
});

// ---------------------------------------------------------------------------
// Repository mock factory
// ---------------------------------------------------------------------------

const buildRepo = <T>(): jest.Mocked<Repository<T>> =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  } as unknown as jest.Mocked<Repository<T>>);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('TagsService', () => {
  let service: TagsService;
  let tagRepo: jest.Mocked<Repository<Tag>>;
  let puzzleRepo: jest.Mocked<Repository<Puzzle>>;
  let dataSource: jest.Mocked<DataSource>;
  let queryRunner: ReturnType<typeof buildQueryRunner>;

  beforeEach(async () => {
    tagRepo = buildRepo<Tag>();
    puzzleRepo = buildRepo<Puzzle>();
    queryRunner = buildQueryRunner();

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: getRepositoryToken(Puzzle), useValue: puzzleRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  // ─── Tag Creation ─────────────────────────────────────────────────────────

  describe('createTag', () => {
    it('normalises name to lowercase and trims whitespace', async () => {
      const dto = { name: '  LOGIC  ' };
      tagRepo.findOne.mockResolvedValue(null);
      const saved = mockTag({ name: 'logic' });
      tagRepo.create.mockReturnValue(saved);
      tagRepo.save.mockResolvedValue(saved);

      const result = await service.createTag(dto as any);

      expect(tagRepo.findOne).toHaveBeenCalledWith({ where: { name: 'logic' } });
      expect(result.name).toBe('logic');
    });

    it('returns the created tag', async () => {
      const dto = { name: 'math' };
      tagRepo.findOne.mockResolvedValue(null);
      const saved = mockTag({ name: 'math', id: 'new-id' });
      tagRepo.create.mockReturnValue(saved);
      tagRepo.save.mockResolvedValue(saved);

      const result = await service.createTag(dto as any);

      expect(result).toEqual(saved);
    });

    it('throws ConflictException when tag name already exists', async () => {
      tagRepo.findOne.mockResolvedValue(mockTag({ name: 'logic' }));

      await expect(service.createTag({ name: 'logic' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── List Tags ────────────────────────────────────────────────────────────

  describe('listTags', () => {
    it('returns tags ordered by name ASC by default', async () => {
      const tags = [mockTag({ name: 'beginner' }), mockTag({ name: 'math' })];
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(tags),
      };
      tagRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.listTags({});

      expect(qb.orderBy).toHaveBeenCalledWith('tag.name', 'ASC');
      expect(result).toEqual(tags);
    });

    it('orders by usageCount DESC when requested', async () => {
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      tagRepo.createQueryBuilder = jest.fn().mockReturnValue(qb);

      await service.listTags({
        sortBy: TagSortBy.USAGE_COUNT,
        sortOrder: TagSortOrder.DESC,
      });

      expect(qb.orderBy).toHaveBeenCalledWith('tag.usageCount', 'DESC');
    });
  });

  // ─── Attach Tags ──────────────────────────────────────────────────────────

  describe('attachTags', () => {
    it('creates new tags that do not exist and attaches them to the puzzle', async () => {
      const puzzle = mockPuzzle();
      puzzleRepo.findOne
        .mockResolvedValueOnce(puzzle)           // first call inside attachTags
        .mockResolvedValueOnce({ ...puzzle, tagEntities: [mockTag()] }); // second call after commit

      queryRunner.manager.findOne.mockResolvedValue(null); // tag does not exist
      const newTag = mockTag({ name: 'logic' });
      queryRunner.manager.create.mockReturnValue(newTag);
      queryRunner.manager.save.mockResolvedValue(newTag);

      const result = await service.attachTags('puzzle-uuid-1', ['logic']);

      expect(queryRunner.manager.save).toHaveBeenCalledWith(Tag, expect.objectContaining({ name: 'logic' }));
      expect(queryRunner.manager.increment).toHaveBeenCalledWith(
        Tag,
        { id: newTag.id },
        'usageCount',
        1,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('does not increment usageCount when tag is already attached', async () => {
      const existingTag = mockTag({ id: 'tag-1', name: 'logic' });
      const puzzle = mockPuzzle({ tagEntities: [existingTag] });

      puzzleRepo.findOne
        .mockResolvedValueOnce(puzzle)
        .mockResolvedValueOnce(puzzle);

      queryRunner.manager.findOne.mockResolvedValue(existingTag); // tag exists

      await service.attachTags('puzzle-uuid-1', ['logic']);

      expect(queryRunner.manager.increment).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when puzzle does not exist', async () => {
      puzzleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.attachTags('non-existent', ['logic']),
      ).rejects.toThrow(NotFoundException);
    });

    it('rolls back on error', async () => {
      const puzzle = mockPuzzle();
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      queryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));

      await expect(service.attachTags('puzzle-uuid-1', ['logic'])).rejects.toThrow('DB error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // ─── Detach Tag ───────────────────────────────────────────────────────────

  describe('detachTag', () => {
    it('removes the tag from the puzzle and decrements usageCount', async () => {
      const tag = mockTag({ id: 'tag-1', name: 'logic' });
      const puzzle = mockPuzzle({ tagEntities: [tag] });

      puzzleRepo.findOne
        .mockResolvedValueOnce(puzzle)
        .mockResolvedValueOnce({ ...puzzle, tagEntities: [] });
      tagRepo.findOne.mockResolvedValue(tag);

      await service.detachTag('puzzle-uuid-1', 'tag-1');

      expect(queryRunner.manager.decrement).toHaveBeenCalledWith(
        Tag,
        { id: 'tag-1' },
        'usageCount',
        1,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when puzzle does not exist', async () => {
      puzzleRepo.findOne.mockResolvedValue(null);

      await expect(service.detachTag('bad-id', 'tag-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when tag is not attached to the puzzle', async () => {
      const tag = mockTag({ id: 'tag-1', name: 'logic' });
      const puzzle = mockPuzzle({ tagEntities: [] }); // tag NOT attached

      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      tagRepo.findOne.mockResolvedValue(tag);

      await expect(
        service.detachTag('puzzle-uuid-1', 'tag-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when tag id does not exist', async () => {
      const puzzle = mockPuzzle();
      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      tagRepo.findOne.mockResolvedValue(null); // tag not found

      await expect(
        service.detachTag('puzzle-uuid-1', 'missing-tag-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rolls back on error', async () => {
      const tag = mockTag({ id: 'tag-1', name: 'logic' });
      const puzzle = mockPuzzle({ tagEntities: [tag] });

      puzzleRepo.findOne.mockResolvedValueOnce(puzzle);
      tagRepo.findOne.mockResolvedValue(tag);
      queryRunner.manager.save.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.detachTag('puzzle-uuid-1', 'tag-1'),
      ).rejects.toThrow('DB failure');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // ─── Usage Count Accuracy ─────────────────────────────────────────────────

  describe('usageCount accuracy', () => {
    it('increments usageCount once per new attach', async () => {
      const puzzle = mockPuzzle();
      const tag1 = mockTag({ id: 't1', name: 'logic' });
      const tag2 = mockTag({ id: 't2', name: 'math' });

      puzzleRepo.findOne
        .mockResolvedValueOnce(puzzle)
        .mockResolvedValueOnce(puzzle);

      queryRunner.manager.findOne
        .mockResolvedValueOnce(tag1)
        .mockResolvedValueOnce(tag2);

      await service.attachTags('puzzle-uuid-1', ['logic', 'math']);

      expect(queryRunner.manager.increment).toHaveBeenCalledTimes(2);
      expect(queryRunner.manager.increment).toHaveBeenCalledWith(Tag, { id: 't1' }, 'usageCount', 1);
      expect(queryRunner.manager.increment).toHaveBeenCalledWith(Tag, { id: 't2' }, 'usageCount', 1);
    });

    it('decrements usageCount exactly once on detach', async () => {
      const tag = mockTag({ id: 'tag-1', name: 'logic', usageCount: 3 });
      const puzzle = mockPuzzle({ tagEntities: [tag] });

      puzzleRepo.findOne
        .mockResolvedValueOnce(puzzle)
        .mockResolvedValueOnce(puzzle);
      tagRepo.findOne.mockResolvedValue(tag);

      await service.detachTag('puzzle-uuid-1', 'tag-1');

      expect(queryRunner.manager.decrement).toHaveBeenCalledTimes(1);
      expect(queryRunner.manager.decrement).toHaveBeenCalledWith(
        Tag,
        { id: 'tag-1' },
        'usageCount',
        1,
      );
    });
  });
});
