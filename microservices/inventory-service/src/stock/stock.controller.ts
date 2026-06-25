import { Controller, Post, Get, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import { AdjustStockDto, SetStockDto } from './dto/adjust-stock.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('adjust')
  @ApiOperation({ summary: 'Adjust stock level (add or remove)' })
  @ApiBody({ type: AdjustStockDto })
  async adjustStock(@Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjustStock(adjustStockDto, true);
  }

  @Post('reduce')
  @ApiOperation({ summary: 'Reduce stock level' })
  @ApiBody({ type: AdjustStockDto })
  async reduceStock(@Body() adjustStockDto: AdjustStockDto) {
    return this.stockService.adjustStock(adjustStockDto, false);
  }

  @Post('set')
  @ApiOperation({ summary: 'Set stock level' })
  @ApiBody({ type: SetStockDto })
  async setStock(@Body() setStockDto: SetStockDto) {
    return this.stockService.setStock(setStockDto);
  }

  @Get('inventory/:inventoryId')
  @ApiOperation({ summary: 'Get stock by inventory ID' })
  async getStockByInventory(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.stockService.getStockByInventory(inventoryId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items with low stock' })
  async getLowStockItems(@Query('threshold') threshold?: number) {
    return this.stockService.getLowStockItems(threshold);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get items that are out of stock' })
  async getOutOfStockItems() {
    return this.stockService.getOutOfStockItems();
  }
}