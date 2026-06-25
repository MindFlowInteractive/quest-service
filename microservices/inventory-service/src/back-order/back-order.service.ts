import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BackOrder, BackOrderStatus } from './entities/back-order.entity';
import { CreateBackOrderDto } from './dto/create-back-order.dto';
import { StockService } from '../stock/stock.service';
import { InventoryService } from '../inventory/inventory.service';
import { Stock } from '../stock/entities/stock.entity';

@Injectable()
export class BackOrderService {
  constructor(
    @InjectRepository(BackOrder)
    private backOrderRepository: Repository<BackOrder>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private stockService: StockService,
    private inventoryService: InventoryService,
  ) {}

  async createBackOrder(createBackOrderDto: CreateBackOrderDto): Promise<BackOrder> {
    const { inventoryId, orderId, userId, quantity } = createBackOrderDto;

    await this.inventoryService.findOne(inventoryId);

    let stock = await this.stockRepository.findOne({ where: { inventoryId } });
    if (!stock) {
      stock = await this.stockService.createStockRecord(inventoryId);
    }

    const backOrder = this.backOrderRepository.create({
      inventoryId,
      orderId,
      userId,
      quantity,
      status: BackOrderStatus.PENDING,
      requestedAt: new Date(),
    });

    stock.backOrderQuantity += quantity;
    await this.stockRepository.save(stock);

    return this.backOrderRepository.save(backOrder);
  }

  async processBackOrders(inventoryId: string): Promise<BackOrder[]> {
    const stock = await this.stockRepository.findOne({ where: { inventoryId } });
    const pendingBackOrders = await this.backOrderRepository.find({
      where: { inventoryId, status: BackOrderStatus.PENDING },
      order: { createdAt: 'ASC' },
    });

    const fulfilledBackOrders: BackOrder[] = [];

    for (const backOrder of pendingBackOrders) {
      if (stock.availableQuantity >= backOrder.quantity) {
        backOrder.status = BackOrderStatus.FULFILLED;
        backOrder.fulfilledAt = new Date();
        stock.availableQuantity -= backOrder.quantity;
        await this.backOrderRepository.save(backOrder);
        fulfilledBackOrders.push(backOrder);
      }
    }

    await this.stockRepository.save(stock);
    return fulfilledBackOrders;
  }

  async cancelBackOrder(backOrderId: string): Promise<BackOrder> {
    const backOrder = await this.backOrderRepository.findOne({
      where: { id: backOrderId },
    });

    if (!backOrder) {
      throw new NotFoundException('Back order not found');
    }

    if (backOrder.status !== BackOrderStatus.PENDING) {
      throw new BadRequestException('Only pending back orders can be cancelled');
    }

    const stock = await this.stockRepository.findOne({ where: { inventoryId: backOrder.inventoryId } });
    stock.backOrderQuantity -= backOrder.quantity;
    await this.stockRepository.save(stock);

    backOrder.status = BackOrderStatus.CANCELLED;
    return this.backOrderRepository.save(backOrder);
  }

  async getBackOrdersByOrder(orderId: string): Promise<BackOrder[]> {
    return this.backOrderRepository.find({
      where: { orderId },
      relations: ['inventory'],
    });
  }

  async getBackOrdersByInventory(inventoryId: string): Promise<BackOrder[]> {
    return this.backOrderRepository.find({
      where: { inventoryId },
      relations: ['inventory'],
    });
  }

  async getBackOrdersByUser(userId: string): Promise<BackOrder[]> {
    return this.backOrderRepository.find({
      where: { userId },
      relations: ['inventory'],
    });
  }
}