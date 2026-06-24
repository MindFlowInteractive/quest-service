import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../stock/entities/stock.entity';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async reconcileStock(inventoryId: string, physicalQuantity: number, reason?: string): Promise<Stock> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      throw new Error('Stock record not found');
    }

    const difference = physicalQuantity - stock.totalQuantity;
    stock.totalQuantity = physicalQuantity;
    stock.availableQuantity = physicalQuantity - stock.reservedQuantity;
    stock.lastStockUpdate = new Date();

    return this.stockRepository.save(stock);
  }

  async getReconciliationReport(): Promise<any> {
    const stocks = await this.stockRepository.find({
      relations: ['inventory'],
    });

    return stocks.map((stock) => ({
      inventoryId: stock.inventoryId,
      sku: stock.inventory.sku,
      name: stock.inventory.name,
      totalQuantity: stock.totalQuantity,
      reservedQuantity: stock.reservedQuantity,
      availableQuantity: stock.availableQuantity,
      lastStockUpdate: stock.lastStockUpdate,
      discrepancy: 0,
    }));
  }

  async validateStockConsistency(inventoryId: string): Promise<boolean> {
    const stock = await this.stockRepository.findOne({
      where: { inventoryId },
    });

    if (!stock) {
      return false;
    }

    const expectedAvailable = stock.totalQuantity - stock.reservedQuantity;
    return stock.availableQuantity === expectedAvailable;
  }
}