import { Injectable, Logger } from '@nestjs/common';

export interface PaymentProvider {
  processPayment(paymentData: PaymentData): Promise<PaymentResult>;
  refundPayment(transactionId: string): Promise<RefundResult>;
}

export interface PaymentData {
  amount: number;
  currency: string;
  userId: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethod: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('stripe', new StripePaymentProvider());
    this.providers.set('paypal', new PayPalPaymentProvider());
  }

  async processPayment(
    providerName: string,
    paymentData: PaymentData,
  ): Promise<PaymentResult> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }

    try {
      this.logger.log(
        `Processing payment with ${providerName} for user ${paymentData.userId}`,
      );
      const result = await provider.processPayment(paymentData);

      if (result.success) {
        this.logger.log(
          `Payment successful with transaction ID: ${result.transactionId}`,
        );
      } else {
        this.logger.error(`Payment failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Payment processing error:`, error);
      throw error;
    }
  }

  async refundPayment(
    providerName: string,
    transactionId: string,
  ): Promise<RefundResult> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }

    try {
      this.logger.log(`Processing refund for transaction ${transactionId}`);
      const result = await provider.refundPayment(transactionId);

      if (result.success) {
        this.logger.log(`Refund successful with refund ID: ${result.refundId}`);
      } else {
        this.logger.error(`Refund failed: ${result.error}`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Refund processing error:`, error);
      throw error;
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

class StripePaymentProvider implements PaymentProvider {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (Math.random() > 0.1) {
      return {
        success: true,
        transactionId: `stripe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          provider: 'stripe',
          processedAt: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: 'Insufficient funds',
      };
    }
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (Math.random() > 0.05) {
      return {
        success: true,
        refundId: `stripe_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Refund period expired',
      };
    }
  }
}

class PayPalPaymentProvider implements PaymentProvider {
  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (Math.random() > 0.15) {
      return {
        success: true,
        transactionId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          provider: 'paypal',
          processedAt: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: 'Payment declined',
      };
    }
  }

  async refundPayment(transactionId: string): Promise<RefundResult> {
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (Math.random() > 0.08) {
      return {
        success: true,
        refundId: `paypal_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        error: 'Transaction not refundable',
      };
    }
  }
}
