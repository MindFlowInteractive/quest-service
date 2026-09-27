import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BattlePassService } from './battle-pass.service';
import { BattlePass, BattlePassStatus } from './entities/battle-pass.entity';
import { BattlePassTier } from './entities/battle-pass-tier.entity';
import { PlayerBattlePass } from './entities/player-battle-pass.entity';

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
  increment: jest.fn().mockResolvedValue(undefined),
});

const baseBattlePass = (): BattlePass => ({
  id: 'bp-1',
  name: 'Season One',
  season: '2025-Q1',
  startDate: new Date(Date.now() - 1000),
  endDate: new Date(Date.now() + 86400000 * 90),
  status: BattlePassStatus.ACTIVE,
  xpPerTier: 1000,
  totalTiers: 50,
  analytics: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  tiers: [],
  playerProgress: [],
});

const baseTier = (n: number, xp: number): BattlePassTier => ({
  id: `tier-${n}`,
  battlePassId: 'bp-1',
  tierNumber: n,
  xpRequired: xp,
  freeReward: { type: 'points', name: `Tier ${n} Free Reward`, value: 100 },
  premiumReward: { type: 'badge', name: `Tier ${n} Premium Badge` },
  createdAt: new Date(),
  updatedAt: new Date(),
  battlePass: {} as any,
});

const baseProgress = (): PlayerBattlePass => ({
  id: 'prog-1',
  userId: 'user-1',
  battlePassId: 'bp-1',
  isPremium: false,
  currentXp: 0,
  currentTier: 0,
  claimedFreeRewards: [],
  claimedPremiumRewards: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  battlePass: {} as any,
});

describe('BattlePassService', () => {
  let service: BattlePassService;
  let bpRepo: ReturnType<typeof mockRepo>;
  let tierRepo: ReturnType<typeof mockRepo>;
  let progressRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    bpRepo = mockRepo();
    tierRepo = mockRepo();
    progressRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattlePassService,
        { provide: getRepositoryToken(BattlePass), useValue: bpRepo },
        { provide: getRepositoryToken(BattlePassTier), useValue: tierRepo },
        { provide: getRepositoryToken(PlayerBattlePass), useValue: progressRepo },
      ],
    }).compile();

    service = module.get<BattlePassService>(BattlePassService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a battle pass in DRAFT status', async () => {
      bpRepo.findOne.mockResolvedValue(null);
      bpRepo.create.mockReturnValue({ ...baseBattlePass(), status: BattlePassStatus.DRAFT });
      bpRepo.save.mockResolvedValue({ ...baseBattlePass(), status: BattlePassStatus.DRAFT });

      const result = await service.create({
        name: 'Season One',
        season: '2025-Q1',
        startDate: new Date(Date.now() + 1000),
        endDate: new Date(Date.now() + 86400000),
        xpPerTier: 1000,
        totalTiers: 50,
      });

      expect(result.status).toBe(BattlePassStatus.DRAFT);
    });

    it('rejects duplicate season', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());

      await expect(
        service.create({
          name: 'Season One',
          season: '2025-Q1',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          xpPerTier: 1000,
          totalTiers: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when startDate >= endDate', async () => {
      bpRepo.findOne.mockResolvedValue(null);
      const now = new Date();
      await expect(
        service.create({
          name: 'Bad Pass',
          season: '2025-Q2',
          startDate: now,
          endDate: now,
          xpPerTier: 1000,
          totalTiers: 50,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── earnXp ──────────────────────────────────────────────────────────────

  describe('earnXp', () => {
    it('advances tiers when XP threshold is crossed', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      progressRepo.findOne.mockResolvedValue({ ...baseProgress(), currentXp: 0, currentTier: 0 });
      tierRepo.find.mockResolvedValue([
        baseTier(1, 1000),
        baseTier(2, 2000),
      ]);
      progressRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.earnXp('user-1', 'bp-1', { xp: 1500 });

      expect(result.currentTier).toBe(1);
      expect(result.newlyUnlockedTiers).toHaveLength(1);
      expect(result.currentXp).toBe(1500);
    });

    it('can unlock multiple tiers in a single XP grant', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      progressRepo.findOne.mockResolvedValue({ ...baseProgress() });
      tierRepo.find.mockResolvedValue([baseTier(1, 1000), baseTier(2, 2000), baseTier(3, 3000)]);
      progressRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.earnXp('user-1', 'bp-1', { xp: 3500 });
      expect(result.currentTier).toBe(3);
      expect(result.newlyUnlockedTiers).toHaveLength(3);
    });

    it('throws when battle pass is not active', async () => {
      bpRepo.findOne.mockResolvedValue({ ...baseBattlePass(), status: BattlePassStatus.EXPIRED });

      await expect(
        service.earnXp('user-1', 'bp-1', { xp: 500 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── purchasePremium ─────────────────────────────────────────────────────

  describe('purchasePremium', () => {
    it('grants premium and retroactive rewards', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      const progress = { ...baseProgress(), currentTier: 2, claimedPremiumRewards: [] };
      progressRepo.findOne.mockResolvedValue(progress);
      tierRepo.find.mockResolvedValue([baseTier(1, 1000), baseTier(2, 2000)]);
      progressRepo.save.mockImplementation((d) => Promise.resolve(d));
      bpRepo.save.mockResolvedValue(baseBattlePass());

      const result = await service.purchasePremium('user-1', 'bp-1');

      expect(result.isPremium).toBe(true);
      expect(result.claimedPremiumRewards).toHaveLength(2); // retroactive for tier 1 & 2
      expect(result.retroactivePurchaseGrantedAt).toBeDefined();
    });

    it('throws when player already has premium', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      progressRepo.findOne.mockResolvedValue({ ...baseProgress(), isPremium: true });

      await expect(
        service.purchasePremium('user-1', 'bp-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── claimReward ─────────────────────────────────────────────────────────

  describe('claimReward', () => {
    it('claims a free tier reward successfully', async () => {
      progressRepo.findOne.mockResolvedValue({ ...baseProgress(), currentTier: 1, claimedFreeRewards: [] });
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      tierRepo.findOne.mockResolvedValue(baseTier(1, 1000));
      progressRepo.save.mockImplementation((d) => Promise.resolve(d));

      const result = await service.claimReward('user-1', 'bp-1', { tierNumber: 1, track: 'free' });
      expect(result.reward).toBeDefined();
    });

    it('throws when tier not yet unlocked', async () => {
      progressRepo.findOne.mockResolvedValue({ ...baseProgress(), currentTier: 0 });
      bpRepo.findOne.mockResolvedValue(baseBattlePass());

      await expect(
        service.claimReward('user-1', 'bp-1', { tierNumber: 1, track: 'free' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when premium reward claimed without premium track', async () => {
      progressRepo.findOne.mockResolvedValue({ ...baseProgress(), currentTier: 1, isPremium: false });
      bpRepo.findOne.mockResolvedValue(baseBattlePass());

      await expect(
        service.claimReward('user-1', 'bp-1', { tierNumber: 1, track: 'premium' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when reward already claimed', async () => {
      progressRepo.findOne.mockResolvedValue({
        ...baseProgress(),
        currentTier: 1,
        claimedFreeRewards: ['tier-1'],
      });
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      tierRepo.findOne.mockResolvedValue(baseTier(1, 1000));

      await expect(
        service.claimReward('user-1', 'bp-1', { tierNumber: 1, track: 'free' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getAnalytics ────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('computes analytics correctly', async () => {
      bpRepo.findOne.mockResolvedValue(baseBattlePass());
      progressRepo.find.mockResolvedValue([
        { ...baseProgress(), currentXp: 2000, currentTier: 2, isPremium: true },
        { ...baseProgress(), id: 'p2', userId: 'u2', currentXp: 1000, currentTier: 1, isPremium: false },
      ]);
      tierRepo.find.mockResolvedValue([baseTier(1, 1000), baseTier(2, 2000)]);

      const analytics = await service.getAnalytics('bp-1');
      expect(analytics.totalPlayers).toBe(2);
      expect(analytics.premiumPlayers).toBe(1);
      expect(analytics.premiumConversionRate).toBe(0.5);
      expect(analytics.averageXpEarned).toBe(1500);
    });
  });
});
