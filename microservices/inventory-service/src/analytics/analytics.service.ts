import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../stock/entities/stock.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { ReservationStatus } from '../reservation/entities/reservation.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async getStockSummary(): Promise<any> {
    const stocks = await this.stockRepository.find({
      relations: ['inventory'],
    });

    const totalItems = stocks.length;
    const totalStock = stocks.reduce((sum, stock) => sum + stock.totalQuantity, 0);
    const totalReserved = stocks.reduce((sum, stock) => sum + stock.reservedQuantity, 0);
    const totalAvailable = stocks.reduce((sum, stock) => sum + stock.availableQuantity, 0);
    const lowStockItems = stocks.filter((stock) => stock.availableQuantity <= stock.inventory.lowStockThreshold).length;
    const outOfStockItems = stocks.filter((stock) => stock.availableQuantity === 0).length;

    return {
      totalItems,
      totalStock,
      totalReserved,
      totalAvailable,
      lowStockItems,
      outOfStockItems,
      utilizationRate: totalStock > 0 ? (totalReserved / totalStock) * 100 : 0,
    };
  }

  async getReservationAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.createdAt BETWEEN :start AND :end', {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      })
      .getMany();

    const totalReservations = reservations.length;
    const pendingReservations = reservations.filter((r) => r.status === ReservationStatus.PENDING).length;
    const confirmedReservations = reservations.filter((r) => r.status === ReservationStatus.CONFIRMED).length;
    const fulfilledReservations = reservations.filter((r) => r.status === ReservationStatus.FULFILLED).length;
    const cancelledReservations = reservations.filter((r) => r.status === ReservationStatus.CANCELLED).length;
    const expiredReservations = reservations.filter((r) => r.status === ReservationStatus.EXPIRED).length;

    const totalQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0);

    return {
      period: { startDate, endDate },
      totalReservations,
      pendingReservations,
      confirmedReservations,
      fulfilledReservations,
      cancelledReservations,
      expiredReservations,
      totalQuantity,
      fulfillmentRate: totalReservations > 0 ? (fulfilledReservations / totalReservations) * 100 : 0,
    };
  }

  async getTopSellingItems(limit: number = 10): Promise<any> {
    const fulfilledReservations = await this.reservationRepository.find({
      where: { status: ReservationStatus.FULFILLED },
      relations: ['inventory'],
      take: 1000,
    });

    const itemSales: Record<string, { quantity: number; name: string; sku: string }> = {};

    for (const reservation of fulfilledReservations) {
      const key = reservation.inventoryId;
      if (!itemSales[key]) {
        itemSales[key] = {
          quantity: 0,
          name: reservation.inventory?.name || 'Unknown',
          sku: reservation.inventory?.sku || 'Unknown',
        };
      }
      itemSales[key].quantity += reservation.quantity;
    }

    return Object.entries(itemSales)
      .map(([inventoryId, data]) => ({ inventoryId, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  async getInventoryTurnoverRate(): Promise<any> {
    const stocks = await this.stockRepository.find({
      relations: ['inventory'],
    });

    return stocks.map((stock) => ({
      inventoryId: stock.inventoryId,
      sku: stock.inventory.sku,
      name: stock.inventory.name,
      totalQuantity: stock.totalQuantity,
      availableQuantity: stock.availableQuantity,
      turnoverRate: stock.totalQuantity > 0 ? (stock.reservedQuantity + (stock.availableQuantity || 0)) / stock.totalQuantity : 0,
    }));
  }
}