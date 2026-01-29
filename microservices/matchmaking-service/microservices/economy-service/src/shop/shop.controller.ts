import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ShopService,
  CreateShopItemDto,
  UpdateShopItemDto,
} from './shop.service';
import { ShopItemStatus, ShopItemType } from './shop-item.entity';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  async createShopItem(@Body() createShopItemDto: CreateShopItemDto) {
    return this.shopService.createShopItem(createShopItemDto);
  }

  @Get()
  async getAllShopItems(@Body() body: { status?: ShopItemStatus }) {
    return this.shopService.getAllShopItems(body.status);
  }

  @Get('type/:itemType')
  async getShopItemsByType(@Param('itemType') itemType: ShopItemType) {
    return this.shopService.getShopItemsByType(itemType);
  }

  @Get('hints')
  async getHintItems() {
    return this.shopService.getHintItems();
  }

  @Get('energy-refills')
  async getEnergyRefillItems() {
    return this.shopService.getEnergyRefillItems();
  }

  @Get('power-ups')
  async getPowerUpItems() {
    return this.shopService.getPowerUpItems();
  }

  @Get('cosmetics')
  async getCosmeticItems() {
    return this.shopService.getCosmeticItems();
  }

  @Get(':id')
  async getShopItemById(@Param('id') id: string) {
    return this.shopService.getShopItemById(id);
  }

  @Put(':id')
  async updateShopItem(
    @Param('id') id: string,
    @Body() updateShopItemDto: UpdateShopItemDto,
  ) {
    return this.shopService.updateShopItem(id, updateShopItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteShopItem(@Param('id') id: string) {
    return this.shopService.deleteShopItem(id);
  }

  @Post(':shopItemId/purchase')
  @HttpCode(HttpStatus.OK)
  async purchaseShopItem(
    @Param('shopItemId') shopItemId: string,
    @Body() body: { userId: string },
  ) {
    return this.shopService.purchaseShopItem(body.userId, shopItemId);
  }
}
