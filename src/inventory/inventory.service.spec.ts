import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PlayerInventory, ItemCategory } from './entities/player-inventory.entity';
import { InventoryItem, ItemRarity } from './entities/inventory-item.entity';

const mockRepo = () => ({
  create: jest.fn((d) => d),
  save: jest.fn((d) => Promise.resolve({ ...d, id: d.id ?? 'generated-id' })),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn().mockResolvedValue(undefined),
});

const baseInventory = (): PlayerInventory => ({
  id: 'inv-1',
  userId: 'user-1',
  maxSlots: 100,
  usedSlots: 0,
  analytics: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
});

const baseItem = (): InventoryItem => ({
  id: 'item-1',
  inventoryId: 'inv-1',
  itemId: 'ref-item-1',
  name: 'Fire Badge',
  category: ItemCategory.ACHIEVEMENT,
  rarity: ItemRarity.RARE,
  quantity: 1,
  isEquipped: false,
  acquiredAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  inventory: {} as any,
});

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepo: ReturnType<typeof mockRepo>;
  let itemRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    inventoryRepo = mockRepo();
    itemRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(PlayerInventory), useValue: inventoryRepo },
        { provide: getRepositoryToken(InventoryItem), useValue: itemRepo },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getOrCreate ─────────────────────────────────────────────────────────

  describe('getOrCreate', () => {
    it('returns existing inventory', async () => {
      inventoryRepo.findOne.mockResolvedValue(baseInventory());
      const result = await service.getOrCreate('user-1');
      expect(result.userId).toBe('user-1');
    });

    it('creates inventory if none exists', async () => {
      inventoryRepo.findOne.mockResolvedValue(null);
      inventoryRepo.create.mockReturnValue(baseInventory());
      inventoryRepo.save.mockResolvedValue(baseInventory());
      const result = await service.getOrCreate('user-1');
      expect(result.userId).toBe('user-1');
      expect(inventoryRepo.save).toHaveBeenCalled();
    });
  });

  // ─── addItem ─────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('adds a new item when inventory has space', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.findOne.mockResolvedValue(null);
      itemRepo.create.mockReturnValue(baseItem());
      itemRepo.save.mockResolvedValue(baseItem());
      inventoryRepo.save.mockResolvedValue(baseInventory());

      const result = await service.addItem('user-1', {
        itemId: 'ref-item-1',
        name: 'Fire Badge',
        category: ItemCategory.ACHIEVEMENT,
        rarity: ItemRarity.RARE,
      });

      expect(result.name).toBe('Fire Badge');
    });

    it('stacks item when it already exists in inventory', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      const existingItem = { ...baseItem(), quantity: 3, maxStack: 10 };
      itemRepo.findOne.mockResolvedValue(existingItem);
      itemRepo.save.mockResolvedValue({ ...existingItem, quantity: 4 });

      const result = await service.addItem('user-1', {
        itemId: 'ref-item-1',
        name: 'Fire Badge',
        category: ItemCategory.ACHIEVEMENT,
        rarity: ItemRarity.RARE,
        quantity: 1,
      });

      expect(result.quantity).toBe(4);
    });

    it('throws when inventory is full', async () => {
      inventoryRepo.findOne.mockResolvedValue({
        ...baseInventory(),
        maxSlots: 1,
        usedSlots: 1,
      });
      itemRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addItem('user-1', {
          itemId: 'ref-item-2',
          name: 'Water Badge',
          category: ItemCategory.ACHIEVEMENT,
          rarity: ItemRarity.COMMON,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when stack limit is exceeded', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      const existingItem = { ...baseItem(), quantity: 10, maxStack: 10 };
      itemRepo.findOne.mockResolvedValue(existingItem);

      await expect(
        service.addItem('user-1', {
          itemId: 'ref-item-1',
          name: 'Fire Badge',
          category: ItemCategory.ACHIEVEMENT,
          rarity: ItemRarity.RARE,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── removeItem ──────────────────────────────────────────────────────────

  describe('removeItem', () => {
    it('removes item completely when quantity >= stock', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.findOne.mockResolvedValue({ ...baseItem(), quantity: 1 });
      inventoryRepo.save.mockResolvedValue(baseInventory());

      await service.removeItem('user-1', 'item-1', 1);
      expect(itemRepo.remove).toHaveBeenCalled();
    });

    it('decrements quantity when removing less than full stack', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.findOne.mockResolvedValue({ ...baseItem(), quantity: 5 });
      itemRepo.save.mockResolvedValue({ ...baseItem(), quantity: 4 });

      await service.removeItem('user-1', 'item-1', 1);
      expect(itemRepo.save).toHaveBeenCalled();
    });

    it('throws when item not in inventory', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.findOne.mockResolvedValue(null);

      await expect(service.removeItem('user-1', 'missing-id', 1)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getItems (sorting/filtering) ────────────────────────────────────────

  describe('getItems', () => {
    it('returns filtered items by category', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.find.mockResolvedValue([baseItem()]);

      const results = await service.getItems('user-1', { category: ItemCategory.ACHIEVEMENT });
      expect(results).toHaveLength(1);
    });

    it('sorts by rarity in descending order', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      const items = [
        { ...baseItem(), id: 'i1', rarity: ItemRarity.COMMON },
        { ...baseItem(), id: 'i2', rarity: ItemRarity.LEGENDARY },
        { ...baseItem(), id: 'i3', rarity: ItemRarity.RARE },
      ];
      itemRepo.find.mockResolvedValue(items);

      const results = await service.getItems('user-1', { sortBy: 'rarity', order: 'DESC' });
      expect(results[0].rarity).toBe(ItemRarity.LEGENDARY);
      expect(results[2].rarity).toBe(ItemRarity.COMMON);
    });
  });

  // ─── getAnalytics ────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('computes category and rarity breakdown', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), items: [] });
      itemRepo.find.mockResolvedValue([
        { ...baseItem(), category: ItemCategory.ACHIEVEMENT, rarity: ItemRarity.RARE, quantity: 2 },
        { ...baseItem(), id: 'i2', category: ItemCategory.COSMETIC, rarity: ItemRarity.COMMON, quantity: 1 },
      ]);

      const analytics = await service.getAnalytics('user-1');
      expect(analytics.itemsByCategory[ItemCategory.ACHIEVEMENT]).toBe(2);
      expect(analytics.itemsByCategory[ItemCategory.COSMETIC]).toBe(1);
      expect(analytics.totalItems).toBe(3);
      expect(analytics.mostPopularCategory).toBe(ItemCategory.ACHIEVEMENT);
    });
  });

  // ─── updateSlotLimit ─────────────────────────────────────────────────────

  describe('updateSlotLimit', () => {
    it('updates slot limit successfully', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), usedSlots: 5 });
      inventoryRepo.save.mockResolvedValue({ ...baseInventory(), maxSlots: 200 });

      const result = await service.updateSlotLimit('user-1', 200);
      expect(result.maxSlots).toBe(200);
    });

    it('rejects if new limit is below used slots', async () => {
      inventoryRepo.findOne.mockResolvedValue({ ...baseInventory(), usedSlots: 50 });
      await expect(service.updateSlotLimit('user-1', 10)).rejects.toThrow(BadRequestException);
    });
  });
});
