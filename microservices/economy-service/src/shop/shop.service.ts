import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopItem, ShopItemType, ShopItemStatus } from './shop-item.entity';

export class CreateShopItemDto {
  name: string;
  description?: string;
  itemType: ShopItemType;
  price: number;
  currency?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  maxPurchaseLimit?: number;
  expiresAt?: Date;
}

export class UpdateShopItemDto {
  name?: string;
  description?: string;
  itemType?: ShopItemType;
  price?: number;
  currency?: string;
  status?: ShopItemStatus;
  imageUrl?: string;
  metadata?: Record<string, any>;
  maxPurchaseLimit?: number;
  expiresAt?: Date;
}

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopItem)
    private readonly shopItemRepository: Repository<ShopItem>,
  ) {}

  async createShopItem(
    createShopItemDto: CreateShopItemDto,
  ): Promise<ShopItem> {
    const shopItem = this.shopItemRepository.create(createShopItemDto);
    return this.shopItemRepository.save(shopItem);
  }

  async getAllShopItems(status?: ShopItemStatus): Promise<ShopItem[]> {
    const whereClause = status ? { status } : {};
    return this.shopItemRepository.find({
      where: whereClause,
      order: { createdAt: 'ASC' },
    });
  }

  async getShopItemById(id: string): Promise<ShopItem> {
    const shopItem = await this.shopItemRepository.findOne({ where: { id } });
    if (!shopItem) {
      throw new NotFoundException(`Shop item with ID ${id} not found`);
    }
    return shopItem;
  }

  async getShopItemsByType(itemType: ShopItemType): Promise<ShopItem[]> {
    return this.shopItemRepository.find({
      where: { itemType, status: ShopItemStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
  }

  async updateShopItem(
    id: string,
    updateShopItemDto: UpdateShopItemDto,
  ): Promise<ShopItem> {
    const shopItem = await this.getShopItemById(id);
    Object.assign(shopItem, updateShopItemDto);
    return this.shopItemRepository.save(shopItem);
  }

  async deleteShopItem(id: string): Promise<void> {
    const shopItem = await this.getShopItemById(id);
    await this.shopItemRepository.remove(shopItem);
  }

  async purchaseShopItem(
    userId: string,
    shopItemId: string,
  ): Promise<{
    shopItem: ShopItem;
    canPurchase: boolean;
    reason?: string;
  }> {
    const shopItem = await this.getShopItemById(shopItemId);

    if (shopItem.status !== ShopItemStatus.ACTIVE) {
      return {
        shopItem,
        canPurchase: false,
        reason: 'Item is not available for purchase',
      };
    }

    if (shopItem.expiresAt && new Date() > shopItem.expiresAt) {
      return {
        shopItem,
        canPurchase: false,
        reason: 'Item has expired',
      };
    }

    if (
      shopItem.maxPurchaseLimit &&
      shopItem.currentPurchaseCount >= shopItem.maxPurchaseLimit
    ) {
      return {
        shopItem,
        canPurchase: false,
        reason: 'Purchase limit reached',
      };
    }

    shopItem.currentPurchaseCount += 1;
    await this.shopItemRepository.save(shopItem);

    return {
      shopItem,
      canPurchase: true,
    };
  }

  async getHintItems(): Promise<ShopItem[]> {
    return this.getShopItemsByType(ShopItemType.HINT);
  }

  async getEnergyRefillItems(): Promise<ShopItem[]> {
    return this.getShopItemsByType(ShopItemType.ENERGY_REFILL);
  }

  async getPowerUpItems(): Promise<ShopItem[]> {
    return this.getShopItemsByType(ShopItemType.POWER_UP);
  }

  async getCosmeticItems(): Promise<ShopItem[]> {
    return this.getShopItemsByType(ShopItemType.COSMETIC);
  }
}
