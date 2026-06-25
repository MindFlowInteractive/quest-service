import { Controller, Post, Get, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { BackOrderService } from './back-order.service';
import { CreateBackOrderDto } from './dto/create-back-order.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('back-orders')
@Controller('back-orders')
export class BackOrderController {
  constructor(private readonly backOrderService: BackOrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a back-order for out-of-stock item' })
  @ApiBody({ type: CreateBackOrderDto })
  async create(@Body() createBackOrderDto: CreateBackOrderDto) {
    return this.backOrderService.createBackOrder(createBackOrderDto);
  }

  @Post('process/:inventoryId')
  @ApiOperation({ summary: 'Process pending back-orders for inventory item' })
  async process(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.backOrderService.processBackOrders(inventoryId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a back-order' })
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.backOrderService.cancelBackOrder(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get back-orders by order ID' })
  async getByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.backOrderService.getBackOrdersByOrder(orderId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get back-orders by user ID' })
  async getByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.backOrderService.getBackOrdersByUser(userId);
  }

  @Get('inventory/:inventoryId')
  @ApiOperation({ summary: 'Get back-orders by inventory ID' })
  async getByInventory(@Param('inventoryId', ParseUUIDPipe) inventoryId: string) {
    return this.backOrderService.getBackOrdersByInventory(inventoryId);
  }
}