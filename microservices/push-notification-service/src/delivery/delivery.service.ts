import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
  ) {}

  async recordDeliveryAttempt(
    notificationId: string,
    deviceId: string,
    token: string,
  ): Promise<Delivery> {
    const delivery = this.deliveryRepo.create({
      notificationId,
      deviceId,
      token,
      status: DeliveryStatus.PENDING,
    });

    return this.deliveryRepo.save(delivery);
  }

  async markSent(
    id: string,
    fcmMessageId?: string,
  ): Promise<void> {
    await this.deliveryRepo.update(id, {
      status: DeliveryStatus.SENT,
      sentAt: new Date(),
      fcmMessageId,
    });
  }

  async markDelivered(id: string): Promise<void> {
    await this.deliveryRepo.update(id, {
      status: DeliveryStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }

  async markFailed(
    id: string,
    errorCode: string,
    errorMessage: string,
  ): Promise<void> {
    await this.deliveryRepo.update(id, {
      status: DeliveryStatus.FAILED,
      errorCode,
      errorMessage,
    });
  }

  async getByNotification(notificationId: string): Promise<Delivery[]> {
    return this.deliveryRepo.find({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDeliveryStats(notificationId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    const deliveries = await this.getByNotification(notificationId);

    return {
      total: deliveries.length,
      sent: deliveries.filter((d) => d.status === DeliveryStatus.SENT).length,
      delivered: deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length,
      failed: deliveries.filter((d) => d.status === DeliveryStatus.FAILED).length,
      pending: deliveries.filter((d) => d.status === DeliveryStatus.PENDING).length,
    };
  }

  async getOverallStats(): Promise<{
    totalDeliveries: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    deliveryRate: number;
  }> {
    const total = await this.deliveryRepo.count();
    const sent = await this.deliveryRepo.count({
      where: { status: DeliveryStatus.SENT },
    });
    const delivered = await this.deliveryRepo.count({
      where: { status: DeliveryStatus.DELIVERED },
    });
    const failed = await this.deliveryRepo.count({
      where: { status: DeliveryStatus.FAILED },
    });

    return {
      totalDeliveries: total,
      sentCount: sent,
      deliveredCount: delivered,
      failedCount: failed,
      deliveryRate: total > 0 ? ((sent + delivered) / total) * 100 : 0,
    };
  }
}
