import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import {
  CosmeticsService,
  isConditionMet,
  validateCondition,
} from './cosmetics.service';
import { CosmeticItem } from './entities/cosmetic-item.entity';
import { PlayerCosmeticUnlock } from './entities/player-cosmetic-unlock.entity';
import { PlayerEquippedCosmetic } from './entities/player-equipped-cosmetic.entity';
import { CosmeticType, UnlockConditionType } from './cosmetics.types';

// ─── Mock factory ────────────────────────────────────────────────────────────

const mockRepo = () => ({
  create: jest.fn((d: object) => ({ ...d })),
  save: jest.fn((d: object & { id?: string }) =>
    Promise.resolve({ ...d, id: d.id ?? 'generated-id' }),
  ),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const TITLE_ID = '11111111-1111-4111-8111-111111111111';
const FRAME_ID = '22222222-2222-4222-8222-222222222222';
const ACH_TITLE_ID = '33333333-3333-4333-8333-333333333333';

const makeItem = (overrides: Partial<CosmeticItem> = {}): CosmeticItem => ({
  id: TITLE_ID,
  slug: 'title-apprentice',
  type: CosmeticType.TITLE,
  name: 'Apprentice',
  description: null,
  displayText: 'Apprentice',
  metadata: {},
  rarity: 'common',
  unlockCondition: { type: UnlockConditionType.LEVEL, threshold: 5 },
  isActive: true,
  sortOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const levelTitle = () => makeItem();
const solverFrame = () =>
  makeItem({
    id: FRAME_ID,
    slug: 'frame-gold',
    type: CosmeticType.AVATAR_FRAME,
    name: 'Gold Frame',
    displayText: null,
    metadata: { color: '#ffcc00' },
    unlockCondition: {
      type: UnlockConditionType.PUZZLES_SOLVED,
      threshold: 100,
    },
  });
const achievementTitle = () =>
  makeItem({
    id: ACH_TITLE_ID,
    slug: 'title-speedster',
    name: 'Speedster',
    displayText: 'Speedster',
    unlockCondition: {
      type: UnlockConditionType.ACHIEVEMENT,
      achievementId: 'ach-speed',
    },
  });

const unlock = (cosmeticId: string) => ({
  id: `unlock-${cosmeticId}`,
  userId: USER_ID,
  cosmeticId,
  source: 'milestone',
  unlockedAt: new Date('2026-02-01'),
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CosmeticsService', () => {
  let service: CosmeticsService;
  let itemRepo: ReturnType<typeof mockRepo>;
  let unlockRepo: ReturnType<typeof mockRepo>;
  let equippedRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    itemRepo = mockRepo();
    unlockRepo = mockRepo();
    equippedRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CosmeticsService,
        { provide: getRepositoryToken(CosmeticItem), useValue: itemRepo },
        {
          provide: getRepositoryToken(PlayerCosmeticUnlock),
          useValue: unlockRepo,
        },
        {
          provide: getRepositoryToken(PlayerEquippedCosmetic),
          useValue: equippedRepo,
        },
      ],
    }).compile();

    service = module.get(CosmeticsService);
  });

  // ─── Unlock conditions ────────────────────────────────────────────────────

  describe('isConditionMet', () => {
    const level5 = { type: UnlockConditionType.LEVEL, threshold: 5 };

    it('is met when the stat reaches the threshold', () => {
      expect(isConditionMet(level5, { level: 5 })).toBe(true);
      expect(isConditionMet(level5, { level: 9 })).toBe(true);
    });

    it('is not met below the threshold', () => {
      expect(isConditionMet(level5, { level: 4 })).toBe(false);
    });

    it('is not met when the stat is missing', () => {
      expect(isConditionMet(level5, { puzzlesSolved: 500 })).toBe(false);
    });

    it('checks each numeric milestone against its own stat', () => {
      expect(
        isConditionMet(
          { type: UnlockConditionType.TOTAL_XP, threshold: 1000 },
          { totalXp: 1000 },
        ),
      ).toBe(true);
      expect(
        isConditionMet(
          { type: UnlockConditionType.STREAK_DAYS, threshold: 7 },
          { streakDays: 6 },
        ),
      ).toBe(false);
    });

    it('matches achievement conditions by id', () => {
      const cond = {
        type: UnlockConditionType.ACHIEVEMENT,
        achievementId: 'ach-speed',
      };
      expect(isConditionMet(cond, { achievementIds: ['ach-speed'] })).toBe(
        true,
      );
      expect(isConditionMet(cond, { achievementIds: ['other'] })).toBe(false);
    });

    it('never auto-unlocks manual items', () => {
      expect(
        isConditionMet(
          { type: UnlockConditionType.MANUAL },
          { level: 99, puzzlesSolved: 9999 },
        ),
      ).toBe(false);
    });
  });

  describe('validateCondition', () => {
    it('requires a threshold for numeric conditions', () => {
      expect(() =>
        validateCondition({ type: UnlockConditionType.LEVEL }),
      ).toThrow(BadRequestException);
    });

    it('requires an achievementId for achievement conditions', () => {
      expect(() =>
        validateCondition({ type: UnlockConditionType.ACHIEVEMENT }),
      ).toThrow(BadRequestException);
    });

    it('accepts manual conditions without extra fields', () => {
      expect(() =>
        validateCondition({ type: UnlockConditionType.MANUAL }),
      ).not.toThrow();
    });
  });

  // ─── Catalog ──────────────────────────────────────────────────────────────

  describe('createCosmetic', () => {
    it('uses the name as display text for titles by default', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      const result = await service.createCosmetic({
        slug: 'title-veteran',
        type: CosmeticType.TITLE,
        name: 'Veteran',
        unlockCondition: { type: UnlockConditionType.LEVEL, threshold: 20 },
      });

      expect(result).toMatchObject({
        displayText: 'Veteran',
        rarity: 'common',
        isActive: true,
      });
    });

    it('rejects a duplicate slug', async () => {
      itemRepo.findOne.mockResolvedValue(levelTitle());

      await expect(
        service.createCosmetic({
          slug: 'title-apprentice',
          type: CosmeticType.TITLE,
          name: 'Again',
          unlockCondition: { type: UnlockConditionType.MANUAL },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an invalid condition before saving', async () => {
      await expect(
        service.createCosmetic({
          slug: 'title-bad',
          type: CosmeticType.TITLE,
          name: 'Bad',
          unlockCondition: { type: UnlockConditionType.PUZZLES_SOLVED },
        }),
      ).rejects.toThrow(BadRequestException);
      expect(itemRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('listCatalog', () => {
    it('filters by type when given', async () => {
      itemRepo.find.mockResolvedValue([levelTitle()]);

      const result = await service.listCatalog(CosmeticType.TITLE);

      expect(itemRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, type: CosmeticType.TITLE },
        }),
      );
      expect(result[0]).toMatchObject({ slug: 'title-apprentice' });
    });
  });

  // ─── Unlocking ────────────────────────────────────────────────────────────

  describe('evaluateUnlocks', () => {
    beforeEach(() => {
      itemRepo.find.mockResolvedValue([
        levelTitle(),
        solverFrame(),
        achievementTitle(),
      ]);
    });

    it('unlocks every item whose condition is now met', async () => {
      unlockRepo.find.mockResolvedValue([]);

      const result = await service.evaluateUnlocks(USER_ID, {
        level: 6,
        puzzlesSolved: 150,
        achievementIds: [],
      });

      expect(result.map((i) => i.id)).toEqual([TITLE_ID, FRAME_ID]);
      expect(unlockRepo.save).toHaveBeenCalledTimes(2);
      expect(unlockRepo.create).toHaveBeenCalledWith({
        userId: USER_ID,
        cosmeticId: TITLE_ID,
        source: 'milestone',
      });
    });

    it('skips items the player already owns', async () => {
      unlockRepo.find.mockResolvedValue([unlock(TITLE_ID)]);

      const result = await service.evaluateUnlocks(USER_ID, { level: 50 });

      expect(result).toHaveLength(0);
      expect(unlockRepo.save).not.toHaveBeenCalled();
    });

    it('unlocks achievement titles', async () => {
      unlockRepo.find.mockResolvedValue([]);

      const result = await service.evaluateUnlocks(USER_ID, {
        achievementIds: ['ach-speed'],
      });

      expect(result.map((i) => i.id)).toEqual([ACH_TITLE_ID]);
    });

    it('ignores a duplicate insert from a concurrent request', async () => {
      unlockRepo.find.mockResolvedValue([]);
      unlockRepo.save.mockRejectedValueOnce({
        driverError: { code: '23505' },
      });

      const result = await service.evaluateUnlocks(USER_ID, { level: 6 });

      expect(result).toHaveLength(0);
    });

    it('rethrows unexpected database errors', async () => {
      unlockRepo.find.mockResolvedValue([]);
      unlockRepo.save.mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.evaluateUnlocks(USER_ID, { level: 6 }),
      ).rejects.toThrow('db down');
    });
  });

  describe('handlePlayerLevelUp', () => {
    it('evaluates level and XP unlocks from the level-up event', async () => {
      const spy = jest.spyOn(service, 'evaluateUnlocks').mockResolvedValue([]);

      await service.handlePlayerLevelUp({
        userId: USER_ID,
        newLevel: 7,
        totalXP: 2400,
      });

      expect(spy).toHaveBeenCalledWith(USER_ID, { level: 7, totalXp: 2400 });
    });
  });

  describe('grantCosmetic', () => {
    it('returns the existing unlock instead of duplicating it', async () => {
      const existing = unlock(TITLE_ID);
      itemRepo.findOne.mockResolvedValue(levelTitle());
      unlockRepo.findOne.mockResolvedValue(existing);

      const result = await service.grantCosmetic(USER_ID, TITLE_ID);

      expect(result).toBe(existing);
      expect(unlockRepo.save).not.toHaveBeenCalled();
    });

    it('records a new unlock with its source', async () => {
      itemRepo.findOne.mockResolvedValue(levelTitle());
      unlockRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...unlock(TITLE_ID), source: 'event' });

      const result = await service.grantCosmetic(USER_ID, TITLE_ID, 'event');

      expect(unlockRepo.create).toHaveBeenCalledWith({
        userId: USER_ID,
        cosmeticId: TITLE_ID,
        source: 'event',
      });
      expect(result.source).toBe('event');
    });

    it('throws for an unknown item', async () => {
      itemRepo.findOne.mockResolvedValue(null);

      await expect(service.grantCosmetic(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Equipping ────────────────────────────────────────────────────────────

  describe('equip', () => {
    it('refuses an item the player has not unlocked', async () => {
      itemRepo.findOne.mockResolvedValue(levelTitle());
      unlockRepo.count.mockResolvedValue(0);

      await expect(service.equip(USER_ID, TITLE_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(equippedRepo.save).not.toHaveBeenCalled();
    });

    it('fills an empty slot', async () => {
      itemRepo.findOne.mockResolvedValue(levelTitle());
      unlockRepo.count.mockResolvedValue(1);
      equippedRepo.findOne.mockResolvedValue(null);

      const result = await service.equip(USER_ID, TITLE_ID);

      expect(equippedRepo.save).toHaveBeenCalledWith({
        userId: USER_ID,
        slot: CosmeticType.TITLE,
        cosmeticId: TITLE_ID,
      });
      expect(result.id).toBe(TITLE_ID);
    });

    it('replaces the item already in the slot', async () => {
      itemRepo.findOne.mockResolvedValue(achievementTitle());
      unlockRepo.count.mockResolvedValue(1);
      equippedRepo.findOne.mockResolvedValue({
        id: 'eq-1',
        userId: USER_ID,
        slot: CosmeticType.TITLE,
        cosmeticId: TITLE_ID,
      });

      await service.equip(USER_ID, ACH_TITLE_ID);

      expect(equippedRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'eq-1', cosmeticId: ACH_TITLE_ID }),
      );
      expect(equippedRepo.create).not.toHaveBeenCalled();
    });

    it('refuses a disabled item', async () => {
      itemRepo.findOne.mockResolvedValue(makeItem({ isActive: false }));

      await expect(service.equip(USER_ID, TITLE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unequip', () => {
    it('clears the slot', async () => {
      equippedRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.unequip(USER_ID, CosmeticType.TITLE);

      expect(equippedRepo.delete).toHaveBeenCalledWith({
        userId: USER_ID,
        slot: CosmeticType.TITLE,
      });
      expect(result).toEqual({ unequipped: true });
    });

    it('reports when nothing was equipped', async () => {
      equippedRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.unequip(USER_ID, CosmeticType.AVATAR_FRAME),
      ).resolves.toEqual({ unequipped: false });
    });
  });

  describe('listOwned', () => {
    it('lists owned items with equipped flags', async () => {
      unlockRepo.find.mockResolvedValue([unlock(TITLE_ID), unlock(FRAME_ID)]);
      itemRepo.find.mockResolvedValue([levelTitle(), solverFrame()]);
      equippedRepo.find.mockResolvedValue([
        { userId: USER_ID, slot: CosmeticType.TITLE, cosmeticId: TITLE_ID },
      ]);

      const result = await service.listOwned(USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: TITLE_ID, equipped: true });
      expect(result[1]).toMatchObject({ id: FRAME_ID, equipped: false });
    });

    it('returns an empty list when nothing is owned', async () => {
      unlockRepo.find.mockResolvedValue([]);

      await expect(service.listOwned(USER_ID)).resolves.toEqual([]);
      expect(itemRepo.find).not.toHaveBeenCalled();
    });
  });

  // ─── Profile display ──────────────────────────────────────────────────────

  describe('getProfileDisplay', () => {
    it('exposes the equipped title and other items', async () => {
      equippedRepo.find.mockResolvedValue([
        { userId: USER_ID, slot: CosmeticType.TITLE, cosmeticId: TITLE_ID },
        {
          userId: USER_ID,
          slot: CosmeticType.AVATAR_FRAME,
          cosmeticId: FRAME_ID,
        },
      ]);
      itemRepo.find.mockResolvedValue([levelTitle(), solverFrame()]);

      const result = await service.getProfileDisplay(USER_ID);

      expect(result.title).toMatchObject({
        id: TITLE_ID,
        displayText: 'Apprentice',
      });
      expect(result.equipped[CosmeticType.AVATAR_FRAME]).toMatchObject({
        id: FRAME_ID,
        metadata: { color: '#ffcc00' },
      });
    });

    it('returns no title when none is equipped', async () => {
      equippedRepo.find.mockResolvedValue([]);

      const result = await service.getProfileDisplay(USER_ID);

      expect(result).toEqual({ userId: USER_ID, title: null, equipped: {} });
    });

    it('hides a title that has since been disabled', async () => {
      equippedRepo.find.mockResolvedValue([
        { userId: USER_ID, slot: CosmeticType.TITLE, cosmeticId: TITLE_ID },
      ]);
      itemRepo.find.mockResolvedValue([]);

      const result = await service.getProfileDisplay(USER_ID);

      expect(result.title).toBeNull();
    });
  });
});
