import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockService } from '../stock/stock.service';
import { ReservationService } from '../reservation/reservation.service';

@Injectable()
export class AlertSchedulerService {
  private readonly logger = new Logger(AlertSchedulerService.name);

  constructor(
    private stockService: StockService,
    private reservationService: ReservationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStockAlerts() {
    const lowStockItems = await this.stockService.getLowStockItems();
    if (lowStockItems.length > 0) {
      this.logger.warn(`Low stock alert: ${lowStockItems.length} items have low stock`);
      for (const item of lowStockItems) {
        this.logger.warn(`Inventory ${item.inventoryId}: ${item.availableQuantity} units available`);
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expireStaleReservations() {
    await this.reservationService.expireReservations();
  }
}