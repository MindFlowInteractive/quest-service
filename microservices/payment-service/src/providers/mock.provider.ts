import { Injectable } from '@nestjs/common';
import {
  BillingInterval,
  PaymentData,
  PaymentProvider,
  PaymentResult,
  RefundResult,
  SubscriptionResult,
} from './payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    if (paymentData.amount <= 0) {
      return { success: false, error: 'Invalid payment amount' };
    }

    return {
      success: true,
      transactionId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      metadata: {
        provider: 'mock',
        processedAt: new Date().toISOString(),
      },
    };
  }

  async refundPayment(
    transactionId: string,
    amount?: number,
  ): Promise<RefundResult> {
    if (!transactionId) {
      return { success: false, error: 'Transaction ID required' };
    }

    return {
      success: true,
      refundId: `mock_refund_${Date.now()}_${amount ?? 'full'}`,
    };
  }

  async createSubscription(
    userId: string,
    planId: string,
    amount: number,
    currency: string,
    interval: BillingInterval,
    paymentMethodId?: string,
  ): Promise<SubscriptionResult> {
    return {
      success: true,
      subscriptionId: `mock_sub_${userId}_${planId}_${interval}_${currency}_${amount}_${paymentMethodId ?? 'default'}`,
    };
  }

  async cancelSubscription(
    externalSubscriptionId: string,
  ): Promise<{ success: boolean }> {
    return { success: Boolean(externalSubscriptionId) };
  }
}
