import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  BoardThemesService,
  assetsChanged,
  withAssetVersion,
} from './board-themes.service';
import { BoardTheme } from './entities/board-theme.entity';
import { PlayerBoardThemeSelection } from './entities/player-board-theme-selection.entity';
import { PlayerBoardThemeUnlock } from './entities/player-board-theme-unlock.entity';

// ─── Mock factory ────────────────────────────────────────────────────────────

const mockRepo = () => ({
  create: jest.fn((d: object) => ({ ...d })),
  save: jest.fn((d: object & { id?: string }) =>
    Promise.resolve({ ...d, id: d.id ?? 'generated-id' }),
  ),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const FREE_ID = '11111111-1111-4111-8111-111111111111';
const LOCKED_ID = '22222222-2222-4222-8222-222222222222';

const makeTheme = (overrides: Partial<BoardTheme> = {}): BoardTheme => ({
  id: FREE_ID,
  slug: 'classic',
  name: 'Classic',
  description: null,
  isFree: true,
  isActive: true,
  unlockHint: null,
  assets: {
    boardImageUrl: 'https://cdn.example.com/classic/board.png',
    previewUrl: 'https://cdn.example.com/classic/preview.png',
    colors: { background: '#ffffff' },
  },
  assetVersion: 1,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const freeTheme = () => makeTheme();
const lockedTheme = () =>
  makeTheme({
    id: LOCKED_ID,
    slug: 'neon-night',
    name: 'Neon Night',
    isFree: false,
    unlockHint: 'Reach level 10',
    sortOrder: 1,
  });

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('BoardThemesService', () => {
  let service: BoardThemesService;
  let themeRepo: ReturnType<typeof mockRepo>;
  let unlockRepo: ReturnType<typeof mockRepo>;
  let selectionRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    themeRepo = mockRepo();
    unlockRepo = mockRepo();
    selectionRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardThemesService,
        { provide: getRepositoryToken(BoardTheme), useValue: themeRepo },
        {
          provide: getRepositoryToken(PlayerBoardThemeUnlock),
          useValue: unlockRepo,
        },
        {
          provide: getRepositoryToken(PlayerBoardThemeSelection),
          useValue: selectionRepo,
        },
      ],
    }).compile();

    service = module.get(BoardThemesService);
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  describe('withAssetVersion', () => {
    it('adds a version query parameter', () => {
      expect(withAssetVersion('https://cdn/x.png', 3)).toBe(
        'https://cdn/x.png?v=3',
      );
    });

    it('appends to an existing query string', () => {
      expect(withAssetVersion('https://cdn/x.png?w=64', 2)).toBe(
        'https://cdn/x.png?w=64&v=2',
      );
    });
  });

  describe('assetsChanged', () => {
    it('detects a changed URL', () => {
      expect(
        assetsChanged({ boardImageUrl: 'a.png' }, { boardImageUrl: 'b.png' }),
      ).toBe(true);
    });

    it('treats identical assets as unchanged', () => {
      expect(
        assetsChanged({ boardImageUrl: 'a.png' }, { boardImageUrl: 'a.png' }),
      ).toBe(false);
    });
  });

  // ─── Catalog management ───────────────────────────────────────────────────

  describe('createTheme', () => {
    it('creates a theme at asset version 1 with defaults', async () => {
      themeRepo.findOne.mockResolvedValue(null);

      const result = await service.createTheme({
        slug: 'ocean',
        name: 'Ocean',
        assets: { boardImageUrl: 'https://cdn/ocean.png' },
      });

      expect(result).toMatchObject({
        slug: 'ocean',
        isFree: false,
        isActive: true,
        assetVersion: 1,
        sortOrder: 0,
      });
    });

    it('rejects a duplicate slug', async () => {
      themeRepo.findOne.mockResolvedValue(freeTheme());

      await expect(
        service.createTheme({ slug: 'classic', name: 'Again', assets: {} }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateTheme', () => {
    it('bumps the asset version when assets change', async () => {
      themeRepo.findOne.mockResolvedValue(freeTheme());

      const result = await service.updateTheme(FREE_ID, {
        assets: { boardImageUrl: 'https://cdn.example.com/classic/v2.png' },
      });

      expect(result.assetVersion).toBe(2);
      expect(result.assets.boardImageUrl).toBe(
        'https://cdn.example.com/classic/v2.png',
      );
    });

    it('keeps the asset version when only metadata changes', async () => {
      themeRepo.findOne.mockResolvedValue(freeTheme());

      const result = await service.updateTheme(FREE_ID, { name: 'Renamed' });

      expect(result.name).toBe('Renamed');
      expect(result.assetVersion).toBe(1);
    });

    it('keeps the asset version when the same assets are sent again', async () => {
      const theme = freeTheme();
      themeRepo.findOne.mockResolvedValue(theme);

      const result = await service.updateTheme(FREE_ID, {
        assets: { ...theme.assets },
      });

      expect(result.assetVersion).toBe(1);
    });

    it('throws when the theme does not exist', async () => {
      themeRepo.findOne.mockResolvedValue(null);

      await expect(service.updateTheme('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Catalog reads ────────────────────────────────────────────────────────

  describe('listThemes', () => {
    it('lists active themes with versioned asset URLs', async () => {
      themeRepo.find.mockResolvedValue([
        makeTheme({ assetVersion: 4 }),
        lockedTheme(),
      ]);

      const result = await service.listThemes();

      expect(themeRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].assets.boardImageUrl).toBe(
        'https://cdn.example.com/classic/board.png?v=4',
      );
      expect(result[0].assets.colors).toEqual({ background: '#ffffff' });
      expect(result[1]).toMatchObject({
        slug: 'neon-night',
        unlockHint: 'Reach level 10',
      });
    });
  });

  describe('getTheme', () => {
    it('hides inactive themes', async () => {
      themeRepo.findOne.mockResolvedValue(makeTheme({ isActive: false }));

      await expect(service.getTheme(FREE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listThemesForPlayer', () => {
    it('marks free themes owned and unowned locked themes locked', async () => {
      themeRepo.find.mockResolvedValue([freeTheme(), lockedTheme()]);
      unlockRepo.find.mockResolvedValue([]);
      selectionRepo.findOne.mockResolvedValue(null);
      themeRepo.findOne.mockResolvedValue(freeTheme());

      const result = await service.listThemesForPlayer(USER_ID);

      expect(result[0]).toMatchObject({
        id: FREE_ID,
        owned: true,
        locked: false,
        selected: true,
      });
      expect(result[1]).toMatchObject({
        id: LOCKED_ID,
        owned: false,
        locked: true,
        selected: false,
      });
    });

    it('unlocks a locked theme the player owns', async () => {
      themeRepo.find.mockResolvedValue([freeTheme(), lockedTheme()]);
      unlockRepo.find.mockResolvedValue([
        { userId: USER_ID, themeId: LOCKED_ID },
      ]);
      selectionRepo.findOne.mockResolvedValue({
        userId: USER_ID,
        themeId: LOCKED_ID,
      });
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.count.mockResolvedValue(1);

      const result = await service.listThemesForPlayer(USER_ID);

      expect(result[1]).toMatchObject({
        owned: true,
        locked: false,
        selected: true,
      });
      expect(result[0].selected).toBe(false);
    });
  });

  // ─── Ownership ────────────────────────────────────────────────────────────

  describe('grantTheme', () => {
    it('records a new unlock', async () => {
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.findOne.mockResolvedValue(null);

      const result = await service.grantTheme(USER_ID, LOCKED_ID, 'purchase');

      expect(unlockRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        userId: USER_ID,
        themeId: LOCKED_ID,
        source: 'purchase',
      });
    });

    it('does not duplicate an existing unlock', async () => {
      const existing = { id: 'u-1', userId: USER_ID, themeId: LOCKED_ID };
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.findOne.mockResolvedValue(existing);

      const result = await service.grantTheme(USER_ID, LOCKED_ID);

      expect(result).toBe(existing);
      expect(unlockRepo.save).not.toHaveBeenCalled();
    });

    it('throws for an unknown theme', async () => {
      themeRepo.findOne.mockResolvedValue(null);

      await expect(service.grantTheme(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Selection ────────────────────────────────────────────────────────────

  describe('selectTheme', () => {
    it('lets any player select a free theme', async () => {
      themeRepo.findOne.mockResolvedValue(freeTheme());

      const result = await service.selectTheme(USER_ID, FREE_ID);

      expect(selectionRepo.save).toHaveBeenCalledWith({
        userId: USER_ID,
        themeId: FREE_ID,
      });
      expect(result.id).toBe(FREE_ID);
      expect(unlockRepo.count).not.toHaveBeenCalled();
    });

    it('blocks a locked theme the player does not own', async () => {
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.count.mockResolvedValue(0);

      await expect(service.selectTheme(USER_ID, LOCKED_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(selectionRepo.save).not.toHaveBeenCalled();
    });

    it('allows a locked theme the player owns', async () => {
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.count.mockResolvedValue(1);

      const result = await service.selectTheme(USER_ID, LOCKED_ID);

      expect(selectionRepo.save).toHaveBeenCalledWith({
        userId: USER_ID,
        themeId: LOCKED_ID,
      });
      expect(result.id).toBe(LOCKED_ID);
    });

    it('rejects an inactive theme', async () => {
      themeRepo.findOne.mockResolvedValue(makeTheme({ isActive: false }));

      await expect(service.selectTheme(USER_ID, FREE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSelectedTheme', () => {
    it('returns the persisted selection', async () => {
      selectionRepo.findOne.mockResolvedValue({
        userId: USER_ID,
        themeId: LOCKED_ID,
      });
      themeRepo.findOne.mockResolvedValue(lockedTheme());
      unlockRepo.count.mockResolvedValue(1);

      const result = await service.getSelectedTheme(USER_ID);

      expect(result?.id).toBe(LOCKED_ID);
    });

    it('falls back to the default free theme when nothing is selected', async () => {
      selectionRepo.findOne.mockResolvedValue(null);
      themeRepo.findOne.mockResolvedValue(freeTheme());

      const result = await service.getSelectedTheme(USER_ID);

      expect(themeRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true, isFree: true } }),
      );
      expect(result?.id).toBe(FREE_ID);
    });

    it('falls back when the selected theme was disabled', async () => {
      selectionRepo.findOne.mockResolvedValue({
        userId: USER_ID,
        themeId: LOCKED_ID,
      });
      themeRepo.findOne
        .mockResolvedValueOnce({ ...lockedTheme(), isActive: false })
        .mockResolvedValueOnce(freeTheme());

      const result = await service.getSelectedTheme(USER_ID);

      expect(result?.id).toBe(FREE_ID);
    });

    it('falls back when the player no longer owns the selected theme', async () => {
      selectionRepo.findOne.mockResolvedValue({
        userId: USER_ID,
        themeId: LOCKED_ID,
      });
      themeRepo.findOne
        .mockResolvedValueOnce(lockedTheme())
        .mockResolvedValueOnce(freeTheme());
      unlockRepo.count.mockResolvedValue(0);

      const result = await service.getSelectedTheme(USER_ID);

      expect(result?.id).toBe(FREE_ID);
    });

    it('returns null when no free theme exists', async () => {
      selectionRepo.findOne.mockResolvedValue(null);
      themeRepo.findOne.mockResolvedValue(null);

      await expect(service.getSelectedTheme(USER_ID)).resolves.toBeNull();
    });
  });
});
