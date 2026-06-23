import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  BillingInterval,
  PaymentData,
  PaymentProvider,
  PaymentResult,
  RefundResult,
  SubscriptionResult,
} from './payment-provider.interface';
import { MockPaymentProvider } from './mock.provider';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);
  private readonly stripe: Stripe | null;
  private readonly mockProvider = new MockPaymentProvider();

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && secretKey !== 'mock' && !secretKey.includes('your_stripe')) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured; using mock payment provider');
    }
  }

  private useMock(): PaymentProvider {
    return this.mockProvider;
  }

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    if (!this.stripe) {
      return this.useMock().processPayment(paymentData);
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100),
        currency: paymentData.currency.toLowerCase(),
        metadata: {
          userId: paymentData.userId,
          ...(paymentData.metadata ?? {}),
        },
        description: paymentData.description,
        confirm: true,
        payment_method: paymentData.paymentMethodId,
        automatic_payment_methods: paymentData.paymentMethodId
          ? undefined
          : { enabled: true, allow_redirects: 'never' },
      });

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
          metadata: { provider: 'stripe', status: paymentIntent.status },
        };
      }

      return {
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
        transactionId: paymentIntent.id,
      };
    } catch (error) {
      this.logger.error('Stripe payment failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe payment failed',
      };
    }
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<RefundResult> {
    if (!this.stripe) {
      return this.useMock().refundPayment(transactionId, amount);
    }

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        success: refund.status === 'succeeded' || refund.status === 'pending',
        refundId: refund.id,
      };
    } catch (error) {
      this.logger.error('Stripe refund failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stripe refund failed',
      };
    }
  }

  async createSubscription(
    userId: string,
    planId: string,
    amount: number,
    currency: string,
    interval: BillingInterval,
    paymentMethodId?: string,
  ): Promise<SubscriptionResult> {
    if (!this.stripe) {
      return this.useMock().createSubscription(
        userId,
        planId,
        amount,
        currency,
        interval,
        paymentMethodId,
      );
    }

    try {
      const price = await this.stripe.prices.create({
        unit_amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        recurring: { interval },
        product_data: { name: planId },
      });

      const subscription = await this.stripe.subscriptions.create({
        customer: userId,
        items: [{ price: price.id }],
        default_payment_method: paymentMethodId,
        metadata: { userId, planId },
      });

      return { success: true, subscriptionId: subscription.id };
    } catch (error) {
      this.logger.error('Stripe subscription creation failed', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Stripe subscription creation failed',
      };
    }
  }

  async cancelSubscription(
    externalSubscriptionId: string,
  ): Promise<{ success: boolean }> {
    if (!this.stripe) {
      return this.useMock().cancelSubscription(externalSubscriptionId);
    }

    try {
      await this.stripe.subscriptions.cancel(externalSubscriptionId);
      return { success: true };
    } catch (error) {
      this.logger.error('Stripe subscription cancellation failed', error);
      return { success: false };
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event | null {
    if (!this.stripe) {
      return null;
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || webhookSecret.includes('your_webhook')) {
      return null;
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
