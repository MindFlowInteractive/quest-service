import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AddItemDto, FilterInventoryDto } from './dto';
import { ItemCategory, ItemRarity } from './entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@ApiTags('Player Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Inventory ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "Get the authenticated user's full inventory" })
  async getInventory(@ActiveUser() user: any) {
    return this.inventoryService.getInventory(user.id ?? user.sub);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get inventory analytics for the authenticated user' })
  async getAnalytics(@ActiveUser() user: any) {
    return this.inventoryService.getAnalytics(user.id ?? user.sub);
  }

  // ─── Items ─────────────────────────────────────────────────────────────────

  @Get('items')
  @ApiOperation({ summary: 'List inventory items with optional filtering and sorting' })
  @ApiQuery({ name: 'category', required: false, enum: ItemCategory })
  @ApiQuery({ name: 'rarity', required: false, enum: ItemRarity })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'] })
  async getItems(
    @ActiveUser() user: any,
    @Query() filters: FilterInventoryDto,
  ) {
    return this.inventoryService.getItems(user.id ?? user.sub, filters);
  }

  @Get('items/:category')
  @ApiOperation({ summary: 'Get all items in a specific category' })
  async getItemsByCategory(
    @ActiveUser() user: any,
    @Param('category') category: ItemCategory,
  ) {
    return this.inventoryService.getItemsByCategory(user.id ?? user.sub, category);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Get a single inventory item by ID' })
  async getItem(
    @ActiveUser() user: any,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.inventoryService.getItem(user.id ?? user.sub, itemId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an item to the inventory' })
  @ApiResponse({ status: 201, description: 'Item added' })
  @ApiResponse({ status: 400, description: 'Inventory full or stack limit exceeded' })
  async addItem(@ActiveUser() user: any, @Body() dto: AddItemDto) {
    return this.inventoryService.addItem(user.id ?? user.sub, dto);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove one or more of an item from the inventory' })
  @ApiQuery({ name: 'quantity', required: false, type: Number })
  async removeItem(
    @ActiveUser() user: any,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Query('quantity', new DefaultValuePipe(1), ParseIntPipe) quantity: number,
  ) {
    await this.inventoryService.removeItem(user.id ?? user.sub, itemId, quantity);
    return { message: 'Item removed successfully' };
  }

  // ─── Slot Management ───────────────────────────────────────────────────────

  @Post('slots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the maximum slot limit for the inventory' })
  async updateSlotLimit(
    @ActiveUser() user: any,
    @Body('maxSlots', ParseIntPipe) maxSlots: number,
  ) {
    return this.inventoryService.updateSlotLimit(user.id ?? user.sub, maxSlots);
  }
}
