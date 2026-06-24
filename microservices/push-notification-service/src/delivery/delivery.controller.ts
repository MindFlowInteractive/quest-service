import { Controller, Get, Param } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('notification/:notificationId')
  async getByNotification(@Param('notificationId') notificationId: string) {
    return this.deliveryService.getByNotification(notificationId);
  }

  @Get('notification/:notificationId/stats')
  async getDeliveryStats(@Param('notificationId') notificationId: string) {
    return this.deliveryService.getDeliveryStats(notificationId);
  }
}
