import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { PlayerInventory, ItemCategory } from './entities/player-inventory.entity';
import { InventoryItem, ItemRarity } from './entities/inventory-item.entity';
import { AddItemDto, FilterInventoryDto } from './dto/inventory.dto';

export interface InventoryAnalytics {
  userId: string;
  totalItems: number;
  usedSlots: number;
  maxSlots: number;
  itemsByCategory: Record<string, number>;
  itemsByRarity: Record<string, number>;
  mostPopularCategory: string | null;
  popularItems: Array<{ name: string; quantity: number; rarity: ItemRarity }>;
}

const RARITY_SORT_ORDER: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 1,
  [ItemRarity.UNCOMMON]: 2,
  [ItemRarity.RARE]: 3,
  [ItemRarity.EPIC]: 4,
  [ItemRarity.LEGENDARY]: 5,
};

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(PlayerInventory)
    private readonly inventoryRepository: Repository<PlayerInventory>,
    @InjectRepository(InventoryItem)
    private readonly itemRepository: Repository<InventoryItem>,
  ) {}

  // ─── Inventory Lifecycle ───────────────────────────────────────────────────

  /**
   * Get or create a player's inventory.
   */
  async getOrCreate(userId: string): Promise<PlayerInventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!inventory) {
      inventory = this.inventoryRepository.create({ userId });
      inventory = await this.inventoryRepository.save(inventory);
      this.logger.log(`Created new inventory for user ${userId}`);
    }

    return inventory;
  }

  async getInventory(userId: string): Promise<PlayerInventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory for user ${userId} not found`);
    }

    return inventory;
  }

  // ─── Item Storage ─────────────────────────────────────────────────────────

  /**
   * Add an item to a player's inventory.
   * Handles stacking for stackable items and enforces slot limits.
   */
  async addItem(userId: string, dto: AddItemDto): Promise<InventoryItem> {
    const inventory = await this.getOrCreate(userId);

    // Check if item already exists and is stackable
    const existingItem = await this.itemRepository.findOne({
      where: { inventoryId: inventory.id, itemId: dto.itemId },
    });

    if (existingItem) {
      return this.stackItem(existingItem, dto.quantity ?? 1);
    }

    // Enforce slot limit
    if (inventory.usedSlots >= inventory.maxSlots) {
      throw new BadRequestException(
        `Inventory is full (${inventory.maxSlots} slots used)`,
      );
    }

    const item = this.itemRepository.create({
      ...dto,
      inventoryId: inventory.id,
      quantity: dto.quantity ?? 1,
      acquiredAt: new Date(),
    });

    const saved = await this.itemRepository.save(item);

    // Update inventory slot count and analytics
    inventory.usedSlots += 1;
    await this.updateAnalytics(inventory, dto.category);
    await this.inventoryRepository.save(inventory);

    return saved;
  }

  private async stackItem(
    item: InventoryItem,
    quantity: number,
  ): Promise<InventoryItem> {
    if (
      item.maxStack !== null &&
      item.maxStack !== undefined &&
      item.quantity + quantity > item.maxStack
    ) {
      throw new BadRequestException(
        `Cannot add ${quantity} more of "${item.name}": stack limit is ${item.maxStack}`,
      );
    }

    item.quantity += quantity;
    return this.itemRepository.save(item);
  }

  async removeItem(userId: string, itemId: string, quantity: number = 1): Promise<void> {
    const inventory = await this.getInventory(userId);
    const item = await this.itemRepository.findOne({
      where: { id: itemId, inventoryId: inventory.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in inventory`);
    }

    if (quantity >= item.quantity) {
      await this.itemRepository.remove(item);
      inventory.usedSlots = Math.max(0, inventory.usedSlots - 1);
      await this.inventoryRepository.save(inventory);
    } else {
      item.quantity -= quantity;
      await this.itemRepository.save(item);
    }
  }

  // ─── Categorization / Filtering / Sorting ─────────────────────────────────

  async getItems(
    userId: string,
    filters: FilterInventoryDto = {},
  ): Promise<InventoryItem[]> {
    const inventory = await this.getInventory(userId);

    const where: Record<string, any> = { inventoryId: inventory.id };
    if (filters.category) where.category = filters.category;
    if (filters.rarity) where.rarity = filters.rarity;

    const sortField = filters.sortBy ?? 'acquiredAt';
    const sortOrder = filters.order ?? 'DESC';

    let items = await this.itemRepository.find({
      where,
      order: sortField !== 'rarity' ? { [sortField]: sortOrder } : undefined,
    });

    // Rarity sorting requires client-side ordering (enum not sortable natively)
    if (sortField === 'rarity') {
      items.sort((a, b) => {
        const diff =
          RARITY_SORT_ORDER[a.rarity] - RARITY_SORT_ORDER[b.rarity];
        return sortOrder === 'ASC' ? diff : -diff;
      });
    }

    return items;
  }

  async getItemsByCategory(
    userId: string,
    category: ItemCategory,
  ): Promise<InventoryItem[]> {
    const inventory = await this.getInventory(userId);
    return this.itemRepository.find({
      where: { inventoryId: inventory.id, category },
      order: { acquiredAt: 'DESC' },
    });
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  async getItem(userId: string, itemId: string): Promise<InventoryItem> {
    const inventory = await this.getInventory(userId);
    const item = await this.itemRepository.findOne({
      where: { id: itemId, inventoryId: inventory.id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    return item;
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  async getAnalytics(userId: string): Promise<InventoryAnalytics> {
    const inventory = await this.getInventory(userId);
    const items = await this.itemRepository.find({
      where: { inventoryId: inventory.id },
    });

    const itemsByCategory: Record<string, number> = {};
    const itemsByRarity: Record<string, number> = {};

    for (const item of items) {
      itemsByCategory[item.category] =
        (itemsByCategory[item.category] ?? 0) + item.quantity;
      itemsByRarity[item.rarity] =
        (itemsByRarity[item.rarity] ?? 0) + item.quantity;
    }

    const mostPopularCategory =
      Object.entries(itemsByCategory).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      null;

    const popularItems = items
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((i) => ({ name: i.name, quantity: i.quantity, rarity: i.rarity }));

    return {
      userId,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      usedSlots: inventory.usedSlots,
      maxSlots: inventory.maxSlots,
      itemsByCategory,
      itemsByRarity,
      mostPopularCategory,
      popularItems,
    };
  }

  private async updateAnalytics(
    inventory: PlayerInventory,
    category: ItemCategory,
  ): Promise<void> {
    const breakdown = inventory.analytics.categoryBreakdown ?? {};
    breakdown[category] = (breakdown[category] ?? 0) + 1;

    const totalEver = (inventory.analytics.totalItemsEverAcquired ?? 0) + 1;
    const mostPopular =
      Object.entries(breakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      undefined;

    inventory.analytics = {
      totalItemsEverAcquired: totalEver,
      categoryBreakdown: breakdown,
      mostPopularCategory: mostPopular,
    };
  }

  // ─── Inventory Limits ─────────────────────────────────────────────────────

  async updateSlotLimit(userId: string, maxSlots: number): Promise<PlayerInventory> {
    const inventory = await this.getOrCreate(userId);

    if (maxSlots < inventory.usedSlots) {
      throw new BadRequestException(
        `Cannot reduce slot limit to ${maxSlots}: ${inventory.usedSlots} slots are currently in use`,
      );
    }

    inventory.maxSlots = maxSlots;
    return this.inventoryRepository.save(inventory);
  }
}
