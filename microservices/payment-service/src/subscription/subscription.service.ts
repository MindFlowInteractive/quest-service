import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { StripePaymentProvider } from '../providers/stripe.provider';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { BillingInterval } from '../providers/payment-provider.interface';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly stripeProvider: StripePaymentProvider,
  ) {}

  private calculatePeriodEnd(
    start: Date,
    interval: BillingInterval,
  ): Date {
    const end = new Date(start);
    if (interval === 'year') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  async createSubscription(dto: CreateSubscriptionDto): Promise<Subscription> {
    const provider = dto.provider ?? 'stripe';
    const now = new Date();
    const periodEnd = this.calculatePeriodEnd(now, dto.billingInterval);

    const subscription = this.subscriptionRepository.create({
      userId: dto.userId,
      planId: dto.planId,
      planName: dto.planName,
      status: 'active',
      amount: dto.amount,
      currency: dto.currency,
      billingInterval: dto.billingInterval,
      provider,
      paymentMethodId: dto.paymentMethodId ?? null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    await this.subscriptionRepository.save(subscription);

    const result = await this.stripeProvider.createSubscription(
      dto.userId,
      dto.planId,
      dto.amount,
      dto.currency,
      dto.billingInterval,
      dto.paymentMethodId,
    );

    if (!result.success) {
      subscription.status = 'past_due';
      await this.subscriptionRepository.save(subscription);
      throw new BadRequestException(result.error ?? 'Subscription creation failed');
    }

    subscription.externalSubscriptionId = result.subscriptionId ?? null;
    return this.subscriptionRepository.save(subscription);
  }

  async cancelSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (subscription.status === 'cancelled') {
      throw new BadRequestException('Subscription already cancelled');
    }

    if (subscription.externalSubscriptionId) {
      await this.stripeProvider.cancelSubscription(
        subscription.externalSubscriptionId,
      );
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    return this.subscriptionRepository.save(subscription);
  }

  async processBillingCycle(id: string): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (subscription.status !== 'active') {
      throw new BadRequestException('Subscription is not active');
    }

    const now = new Date();
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = this.calculatePeriodEnd(
      now,
      subscription.billingInterval,
    );

    return this.subscriptionRepository.save(subscription);
  }

  findByUser(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription ${id} not found`);
    }
    return subscription;
  }

  async updateStatus(
    externalSubscriptionId: string,
    status: Subscription['status'],
  ): Promise<Subscription | null> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { externalSubscriptionId },
    });

    if (!subscription) {
      return null;
    }

    subscription.status = status;
    if (status === 'cancelled') {
      subscription.cancelledAt = new Date();
    }

    return this.subscriptionRepository.save(subscription);
  }
}
