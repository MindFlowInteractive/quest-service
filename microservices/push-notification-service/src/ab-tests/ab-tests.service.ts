import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ABTest, ABTestStatus } from './entities/ab-test.entity';
import { CreateABTestDto, CompleteABTestDto } from './dto/ab-test.dto';
import { Delivery, DeliveryStatus } from '../delivery/entities/delivery.entity';
import {
  PushNotification,
  PushNotificationStatus,
  PushNotificationType,
} from '../notifications/entities/push-notification.entity';
import { SegmentsService } from '../segments/segments.service';

@Injectable()
export class ABTestsService {
  private readonly logger = new Logger(ABTestsService.name);

  constructor(
    @InjectRepository(ABTest)
    private readonly abTestRepo: Repository<ABTest>,
    @InjectRepository(PushNotification)
    private readonly notificationRepo: Repository<PushNotification>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    @InjectQueue('push-notifications')
    private readonly pushQueue: Queue,
    private readonly segmentsService: SegmentsService,
  ) {}

  async create(dto: CreateABTestDto): Promise<ABTest> {
    const abTest = this.abTestRepo.create({
      name: dto.name,
      variantA: dto.variantA,
      variantB: dto.variantB,
      splitPercentage: dto.splitPercentage || 50,
      segmentId: dto.segmentId,
      status: ABTestStatus.DRAFT,
    });

    return this.abTestRepo.save(abTest);
  }

  async start(id: string): Promise<ABTest> {
    const abTest = await this.findById(id);

    if (abTest.status !== ABTestStatus.DRAFT) {
      throw new BadRequestException(
        `A/B test must be in DRAFT status to start (current: ${abTest.status})`,
      );
    }

    abTest.status = ABTestStatus.RUNNING;
    abTest.startedAt = new Date();

    return this.abTestRepo.save(abTest);
  }

  async launch(id: string): Promise<{
    abTest: ABTest;
    queued: number;
    variantA: number;
    variantB: number;
  }> {
    const abTest = await this.findById(id);

    if (abTest.status !== ABTestStatus.DRAFT) {
      throw new BadRequestException(
        `A/B test must be in DRAFT status to launch (current: ${abTest.status})`,
      );
    }

    if (!abTest.segmentId) {
      throw new BadRequestException('A/B test requires a segmentId to launch');
    }

    abTest.status = ABTestStatus.RUNNING;
    abTest.startedAt = new Date();
    await this.abTestRepo.save(abTest);

    const devices = await this.segmentsService.resolveDevices(abTest.segmentId);
    const userIds = [...new Set(devices.map((device) => device.userId))];
    let variantA = 0;
    let variantB = 0;

    for (const userId of userIds) {
      const abVariant = this.assignVariant(abTest.splitPercentage);
      const variantPayload =
        abVariant === 'A' ? abTest.variantA : abTest.variantB;

      const notification = this.notificationRepo.create({
        userId,
        title: variantPayload.title,
        body: variantPayload.body,
        data: variantPayload.data,
        imageUrl: variantPayload.imageUrl,
        type: PushNotificationType.PROMOTIONAL,
        status: PushNotificationStatus.QUEUED,
        segmentId: abTest.segmentId,
        abTestId: abTest.id,
        abVariant,
      });

      await this.notificationRepo.save(notification);
      await this.pushQueue.add('send-push', {
        notificationId: notification.id,
        userId,
      });

      if (abVariant === 'A') {
        variantA += 1;
      } else {
        variantB += 1;
      }
    }

    this.logger.log(
      `A/B test ${id} launched for ${userIds.length} users (${variantA} A, ${variantB} B)`,
    );

    return {
      abTest,
      queued: userIds.length,
      variantA,
      variantB,
    };
  }

  async complete(id: string, dto: CompleteABTestDto): Promise<ABTest> {
    const abTest = await this.findById(id);

    if (abTest.status !== ABTestStatus.RUNNING) {
      throw new BadRequestException(
        `A/B test must be in RUNNING status to complete (current: ${abTest.status})`,
      );
    }

    if (dto.winnerId !== 'A' && dto.winnerId !== 'B') {
      throw new BadRequestException('winnerId must be "A" or "B"');
    }

    abTest.status = ABTestStatus.COMPLETED;
    abTest.winnerId = dto.winnerId;
    abTest.completedAt = new Date();

    return this.abTestRepo.save(abTest);
  }

  async cancel(id: string): Promise<ABTest> {
    const abTest = await this.findById(id);

    if (
      abTest.status !== ABTestStatus.DRAFT &&
      abTest.status !== ABTestStatus.RUNNING
    ) {
      throw new BadRequestException(
        `Cannot cancel A/B test with status ${abTest.status}`,
      );
    }

    abTest.status = ABTestStatus.CANCELLED;
    return this.abTestRepo.save(abTest);
  }

  async findById(id: string): Promise<ABTest> {
    const abTest = await this.abTestRepo.findOne({ where: { id } });
    if (!abTest) {
      throw new NotFoundException(`A/B test ${id} not found`);
    }
    return abTest;
  }

  async findAll(): Promise<ABTest[]> {
    return this.abTestRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getResults(id: string): Promise<{
    abTest: ABTest;
    variantAStats: any;
    variantBStats: any;
  }> {
    const abTest = await this.findById(id);

    return {
      abTest,
      variantAStats: await this.getVariantStats(id, 'A'),
      variantBStats: await this.getVariantStats(id, 'B'),
    };
  }

  assignVariant(splitPercentage: number): 'A' | 'B' {
    const random = Math.random() * 100;
    return random < splitPercentage ? 'A' : 'B';
  }

  private async getVariantStats(abTestId: string, abVariant: 'A' | 'B') {
    const notifications = await this.notificationRepo.find({
      where: { abTestId, abVariant },
    });
    const notificationIds = notifications.map((notification) => notification.id);

    if (notificationIds.length === 0) {
      return {
        queuedNotifications: 0,
        deliveries: 0,
        sent: 0,
        delivered: 0,
        failed: 0,
        deliveryRate: 0,
      };
    }

    const deliveries = await this.deliveryRepo.find({
      where: { notificationId: In(notificationIds) },
    });
    const sent = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.SENT,
    ).length;
    const delivered = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.DELIVERED,
    ).length;
    const failed = deliveries.filter(
      (delivery) => delivery.status === DeliveryStatus.FAILED,
    ).length;

    return {
      queuedNotifications: notifications.length,
      deliveries: deliveries.length,
      sent,
      delivered,
      failed,
      deliveryRate:
        deliveries.length > 0 ? ((sent + delivered) / deliveries.length) * 100 : 0,
    };
  }
}
