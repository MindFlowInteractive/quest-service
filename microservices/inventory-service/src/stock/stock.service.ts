import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { AdjustStockDto, SetStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private inventoryService: InventoryService,
  ) {}

  async createStockRecord(inventoryId: string): Promise<Stock> {
    await this.inventoryService.findOne(inventoryId);
    const stock = this.stockRepository.create({
      inventoryId,
      totalQuantity: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      backOrderQuantity: 0,
    });
    return this.stockRepository.save(stock);
  }

  async adjustStock(adjustStockDto: AdjustStockDto, isAddition: boolean = true): Promise<Stock> {
    let stock = await this.stockRepository.findOne({
      where: { inventoryId: adjustStockDto.inventoryId },
      relations: ['inventory'],
    });

    if (!stock) {
      stock = await this.createStockRecord(adjustStockDto.inventoryId);
    }

    const quantity = isAddition ? adjustStockDto.quantity : -adjustStockDto.quantity;
    stock.totalQuantity += quantity;
    stock.availableQuantity += quantity;
    stock.lastStockUpdate = new Date();

    if (stock.totalQuantity < 0) {
      throw new BadRequestException('Cannot reduce stock below zero');
    }

    if (stock.availableQuantity < 0) {
      stock.backOrderQuantity += Math.abs(stock.availableQuantity);
      stock.availableQuantity = 0;
    }

    return this.stockRepository.save(stock);
  }

  async setStock(setStockDto: SetStockDto): Promise<Stock> {
    let stock = await this.stockRepository.findOne({
      where: { inventoryId: setStockDto.inventoryId },
    });

    if (!stock) {
      stock = await this.createStockRecord(setStockDto.inventoryId);
    }

    const delta = setStockDto.totalQuantity - stock.totalQuantity;
    stock.totalQuantity = setStockDto.totalQuantity;
    stock.availableQuantity += delta;
    stock.lastStockUpdate = new Date();

    if (stock.availableQuantity < 0) {
      stock.backOrderQuantity += Math.abs(stock.availableQuantity);
      stock.availableQuantity = 0;
    }

    return this.stockRepository.save(stock);
  }

  async reserveStock(inventoryId: string, quantity: number): Promise<boolean> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      return false;
    }

    if (stock.availableQuantity >= quantity) {
      stock.reservedQuantity += quantity;
      stock.availableQuantity -= quantity;
      await this.stockRepository.save(stock);
      return true;
    }

    return false;
  }

  async releaseStock(inventoryId: string, quantity: number): Promise<void> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      return;
    }

    stock.reservedQuantity = Math.max(0, stock.reservedQuantity - quantity);
    stock.availableQuantity += quantity;
    await this.stockRepository.save(stock);
  }

  async deductStock(inventoryId: string, quantity: number): Promise<boolean> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      return false;
    }

    if (stock.reservedQuantity >= quantity) {
      stock.reservedQuantity -= quantity;
      stock.totalQuantity -= quantity;
      await this.stockRepository.save(stock);
      return true;
    }

    return false;
  }

  async getStockByInventory(inventoryId: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      return this.createStockRecord(inventoryId);
    }

    return stock;
  }

  async getLowStockItems(threshold?: number): Promise<Stock[]> {
    const stocks = await this.stockRepository.find({
      relations: ['inventory'],
    });

    return stocks.filter((stock) => {
      const effectiveThreshold = threshold ?? stock.inventory.lowStockThreshold;
      return stock.availableQuantity <= effectiveThreshold && stock.availableQuantity > 0;
    });
  }

  async getOutOfStockItems(): Promise<Stock[]> {
    return this.stockRepository.find({
      where: { availableQuantity: 0 },
      relations: ['inventory'],
    });
  }
}