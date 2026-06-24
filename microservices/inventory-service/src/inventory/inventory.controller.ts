import { Controller, Post, Get, Put, Delete, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ItemType, ItemStatus } from './entities/inventory.entity';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiBody({ type: CreateInventoryDto })
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  async findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findOne(id);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get inventory item by SKU' })
  async findBySku(@Param('sku') sku: string) {
    return this.inventoryService.findBySku(sku);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.remove(id);
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Get inventory items by type' })
  async findByType(@Param('type') type: ItemType) {
    return this.inventoryService.findByType(type);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get inventory items by status' })
  async findByStatus(@Param('status') status: ItemStatus) {
    return this.inventoryService.findByStatus(status);
  }
}