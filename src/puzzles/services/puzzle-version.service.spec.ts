import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { PuzzleVersionService } from './puzzle-version.service';
import { PuzzleVersion } from '../entities/puzzle-version.entity';
import { Puzzle } from '../entities/puzzle.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const makeDataSource = () => ({
  transaction: jest.fn(),
});

/** Build a minimal Puzzle-like object */
const makePuzzle = (overrides: Partial<Puzzle> = {}): Puzzle =>
  ({
    id: 'puzzle-uuid-1',
    title: 'Test Puzzle',
    description: 'Description',
    category: 'logic',
    difficulty: 'medium' as any,
    difficultyRating: 3,
    basePoints: 100,
    timeLimit: 120,
    maxHints: 3,
    content: { correctAnswer: 42 },
    hints: [],
    tags: ['tag1'],
    prerequisites: [],
    scoring: {},
    metadata: { version: '1.0', lastModifiedBy: 'author', reviewStatus: 'approved' } as any,
    isActive: true,
    isFeatured: false,
    publishedAt: null,
    ...overrides,
  } as unknown as Puzzle);

/** Build a minimal PuzzleVersion-like object */
const makeVersion = (overrides: Partial<PuzzleVersion> = {}): PuzzleVersion =>
  ({
    id: 'version-uuid-1',
    puzzleId: 'puzzle-uuid-1',
    version: 1,
    changedBy: 'user-1',
    changeNote: 'initial',
    diff: [],
    content: {
      title: 'Test Puzzle',
      description: 'Description',
      category: 'logic',
      difficulty: 'medium' as any,
      difficultyRating: 3,
      basePoints: 100,
      timeLimit: 120,
      maxHints: 3,
      content: { correctAnswer: 42 },
      hints: [],
      tags: ['tag1'],
      prerequisites: [],
      scoring: {},
      metadata: {} as any,
      isActive: true,
      isFeatured: false,
      publishedAt: null,
    },
    createdAt: new Date('2026-01-01'),
    ...overrides,
  } as PuzzleVersion);

// ─────────────────────────────────────────────────────────────────────────────

describe('PuzzleVersionService', () => {
  let service: PuzzleVersionService;
  let versionRepo: ReturnType<typeof makeRepo>;
  let puzzleRepo: ReturnType<typeof makeRepo>;
  let dataSource: ReturnType<typeof makeDataSource>;

  beforeEach(async () => {
    versionRepo = makeRepo();
    puzzleRepo = makeRepo();
    dataSource = makeDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleVersionService,
        { provide: getRepositoryToken(PuzzleVersion), useValue: versionRepo },
        { provide: getRepositoryToken(Puzzle), useValue: puzzleRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PuzzleVersionService>(PuzzleVersionService);
  });

  afterEach(() => jest.clearAllMocks());

  // ───────────────────────────────────────────────────────────────────────────
  // snapshotBefore
  // ───────────────────────────────────────────────────────────────────────────

  describe('snapshotBefore', () => {
    it('creates version 1 when there is no prior snapshot', async () => {
      const puzzle = makePuzzle();
      versionRepo.findOne.mockResolvedValue(null); // no previous version
      const built = makeVersion({ version: 1, diff: [] });
      versionRepo.create.mockReturnValue(built);
      versionRepo.save.mockResolvedValue(built);

      const result = await service.snapshotBefore(puzzle, 'user-1', 'first edit');

      expect(versionRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { puzzleId: puzzle.id } }),
      );
      expect(versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          puzzleId: puzzle.id,
          version: 1,
          changedBy: 'user-1',
          changeNote: 'first edit',
          diff: [], // first version — no diff
        }),
      );
      expect(result.version).toBe(1);
    });

    it('increments version number from previous snapshot', async () => {
      const puzzle = makePuzzle();
      const prev = makeVersion({ version: 3 });
      versionRepo.findOne.mockResolvedValue(prev);

      const built = makeVersion({ version: 4 });
      versionRepo.create.mockReturnValue(built);
      versionRepo.save.mockResolvedValue(built);

      const result = await service.snapshotBefore(puzzle, 'user-2');

      expect(versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ version: 4 }),
      );
      expect(result.version).toBe(4);
    });

    it('records diff of changed fields', async () => {
      const puzzle = makePuzzle({ title: 'New Title', difficulty: 'hard' as any });
      const prev = makeVersion({
        version: 1,
        content: { ...makeVersion().content, title: 'Old Title', difficulty: 'easy' as any },
      });
      versionRepo.findOne.mockResolvedValue(prev);

      const built = makeVersion({
        version: 2,
        diff: ['title', 'difficulty'],
      });
      versionRepo.create.mockReturnValue(built);
      versionRepo.save.mockResolvedValue(built);

      const result = await service.snapshotBefore(puzzle, 'user-1', 'update title + difficulty');

      // diff should contain the changed fields
      const createCall = versionRepo.create.mock.calls[0][0];
      expect(createCall.diff).toContain('title');
      expect(createCall.diff).toContain('difficulty');
    });

    it('snapshot content is a full copy of the puzzle state', async () => {
      const puzzle = makePuzzle({ basePoints: 250, tags: ['a', 'b'] });
      versionRepo.findOne.mockResolvedValue(null);

      versionRepo.create.mockImplementation((data) => data);
      versionRepo.save.mockImplementation(async (v) => v);

      const result = await service.snapshotBefore(puzzle, 'user-1');

      expect(result.content.basePoints).toBe(250);
      expect(result.content.tags).toEqual(['a', 'b']);
      expect(result.content.title).toBe(puzzle.title);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // getCurrentVersionId
  // ───────────────────────────────────────────────────────────────────────────

  describe('getCurrentVersionId', () => {
    it('returns the id of the latest version', async () => {
      versionRepo.findOne.mockResolvedValue({ id: 'ver-999', version: 5 });

      const id = await service.getCurrentVersionId('puzzle-uuid-1');

      expect(id).toBe('ver-999');
    });

    it('returns null when no versions exist yet', async () => {
      versionRepo.findOne.mockResolvedValue(null);

      const id = await service.getCurrentVersionId('puzzle-uuid-1');

      expect(id).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // listVersions
  // ───────────────────────────────────────────────────────────────────────────

  describe('listVersions', () => {
    it('returns versions newest-first', async () => {
      puzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-uuid-1' });
      const v2 = makeVersion({ id: 'v2', version: 2, createdAt: new Date('2026-02-02') });
      const v1 = makeVersion({ id: 'v1', version: 1, createdAt: new Date('2026-01-01') });
      versionRepo.find.mockResolvedValue([v2, v1]);

      const list = await service.listVersions('puzzle-uuid-1');

      expect(list).toHaveLength(2);
      expect(list[0].version).toBe(2);
      expect(list[1].version).toBe(1);
    });

    it('throws NotFoundException for unknown puzzle', async () => {
      puzzleRepo.findOne.mockResolvedValue(null);

      await expect(service.listVersions('no-such-puzzle')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // getVersion
  // ───────────────────────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('returns the requested version detail', async () => {
      puzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-uuid-1' });
      const v = makeVersion({ version: 2 });
      versionRepo.findOne.mockResolvedValue(v);

      const result = await service.getVersion('puzzle-uuid-1', 2);

      expect(result.version).toBe(2);
      expect(result.content).toBeDefined();
    });

    it('throws NotFoundException when the version number does not exist', async () => {
      puzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-uuid-1' });
      versionRepo.findOne.mockResolvedValue(null);

      await expect(service.getVersion('puzzle-uuid-1', 99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // rollbackTo
  // ───────────────────────────────────────────────────────────────────────────

  describe('rollbackTo', () => {
    it('rolls back to a prior version inside a transaction', async () => {
      const puzzle = makePuzzle();
      const targetVersion = makeVersion({
        version: 2,
        content: {
          ...makeVersion().content,
          title: 'Older Title',
          basePoints: 50,
        },
      });

      // getVersion (calls assertPuzzleExists + findOne)
      puzzleRepo.findOne
        .mockResolvedValueOnce({ id: 'puzzle-uuid-1' }) // assertPuzzleExists inside getVersion
        .mockResolvedValueOnce(puzzle);                  // manager.findOne inside transaction

      versionRepo.findOne
        .mockResolvedValueOnce(targetVersion)  // getVersion lookup
        .mockResolvedValueOnce(makeVersion({ version: 3 })); // nextVersionNumber

      const savedPuzzle = { ...puzzle, title: 'Older Title', basePoints: 50 };

      // Simulate DataSource.transaction calling the callback
      dataSource.transaction.mockImplementation(async (cb: (em: Partial<EntityManager>) => Promise<Puzzle>) => {
        const mockManager: Partial<EntityManager> = {
          findOne: jest.fn()
            .mockResolvedValueOnce(puzzle),     // load puzzle
          save: jest.fn()
            .mockResolvedValueOnce(makeVersion()) // pre-rollback snapshot save
            .mockResolvedValueOnce(savedPuzzle),  // puzzle save
          create: jest.fn().mockReturnValue(makeVersion()),
        };
        return cb(mockManager as EntityManager);
      });

      const result = await service.rollbackTo('puzzle-uuid-1', 2, 'admin-1', 'revert spam');

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.title).toBe('Older Title');
      expect(result.basePoints).toBe(50);
    });

    it('throws NotFoundException when target version does not exist', async () => {
      // assertPuzzleExists passes, but version lookup returns null
      puzzleRepo.findOne.mockResolvedValue({ id: 'puzzle-uuid-1' });
      versionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.rollbackTo('puzzle-uuid-1', 99, 'admin-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Diff computation
  // ───────────────────────────────────────────────────────────────────────────

  describe('diff field computation', () => {
    it('returns empty diff for the first version (nothing to compare)', async () => {
      const puzzle = makePuzzle();
      versionRepo.findOne.mockResolvedValue(null); // no previous version

      versionRepo.create.mockImplementation((data) => data);
      versionRepo.save.mockImplementation(async (v) => v);

      const result = await service.snapshotBefore(puzzle, 'user-1');
      expect(result.diff).toEqual([]);
    });

    it('detects no diff when nothing changed', async () => {
      const puzzle = makePuzzle();
      const prev = makeVersion(); // content identical to makePuzzle()
      versionRepo.findOne.mockResolvedValue(prev);

      versionRepo.create.mockImplementation((data) => data);
      versionRepo.save.mockImplementation(async (v) => v);

      const result = await service.snapshotBefore(puzzle, 'user-1');
      expect(result.diff).toEqual([]);
    });

    it('detects changed title and content fields', async () => {
      const puzzle = makePuzzle({ title: 'Updated Title', content: { type: 'multiple-choice', correctAnswer: 99 } });
      const prev = makeVersion({ content: { ...makeVersion().content, title: 'Old Title', content: { type: 'multiple-choice', correctAnswer: 1 } } });
      versionRepo.findOne.mockResolvedValue(prev);

      versionRepo.create.mockImplementation((data) => data);
      versionRepo.save.mockImplementation(async (v) => v);

      const result = await service.snapshotBefore(puzzle, 'user-1');
      expect(result.diff).toContain('title');
      expect(result.diff).toContain('content');
    });

    it('detects changed difficulty', async () => {
      const puzzle = makePuzzle({ difficulty: 'hard' as any });
      const prev = makeVersion({ content: { ...makeVersion().content, difficulty: 'easy' as any } });
      versionRepo.findOne.mockResolvedValue(prev);

      versionRepo.create.mockImplementation((data) => data);
      versionRepo.save.mockImplementation(async (v) => v);

      const result = await service.snapshotBefore(puzzle, 'editor-1');
      expect(result.diff).toContain('difficulty');
      expect(result.diff).not.toContain('title');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Session version lock (unit contract)
  // ───────────────────────────────────────────────────────────────────────────

  describe('session version lock contract', () => {
    it('getCurrentVersionId is stable — called twice returns same id', async () => {
      versionRepo.findOne.mockResolvedValue({ id: 'locked-ver', version: 7 });

      const id1 = await service.getCurrentVersionId('puzzle-uuid-1');
      const id2 = await service.getCurrentVersionId('puzzle-uuid-1');

      expect(id1).toBe('locked-ver');
      expect(id2).toBe('locked-ver');
    });

    it('after a new snapshot, getCurrentVersionId returns the new version id', async () => {
      const puzzle = makePuzzle();
      const oldSnapshot = makeVersion({ id: 'old-ver', version: 1 });
      const newSnapshot = makeVersion({ id: 'new-ver', version: 2 });

      // snapshotBefore calls:
      //   1. findOne({ order: { version: DESC } })  → find last version to get next number
      // computeDiff calls no extra findOne (it receives the previous version directly)
      // getCurrentVersionId (after snapshot) calls:
      //   2. findOne({ order: { version: DESC } })  → returns new snapshot
      versionRepo.findOne
        .mockResolvedValueOnce(oldSnapshot)  // inside snapshotBefore: determine next version
        .mockResolvedValueOnce(newSnapshot); // getCurrentVersionId after snapshot

      versionRepo.create.mockReturnValue(newSnapshot);
      versionRepo.save.mockResolvedValue(newSnapshot);

      await service.snapshotBefore(puzzle, 'user-1');
      const id = await service.getCurrentVersionId('puzzle-uuid-1');

      expect(id).toBe('new-ver');
    });
  });
});
