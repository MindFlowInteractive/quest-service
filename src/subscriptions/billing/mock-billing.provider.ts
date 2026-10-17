import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  BillingProvider,
  ChargeResult,
  CreateExternalSubscriptionResult,
  CancelExternalSubscriptionResult,
} from './billing-provider.interface';
import { BillingInterval } from '../enums/subscription.enums';

/**
 * MockBillingProvider — used in development / test environments.
 * Replace with a real Stripe / Paddle provider in production by swapping
 * the BILLING_PROVIDER token in SubscriptionsModule.
 */
@Injectable()
export class MockBillingProvider implements BillingProvider {
  private readonly logger = new Logger(MockBillingProvider.name);

  async createCustomer(userId: string, _email: string): Promise<string> {
    const customerId = `cus_mock_${userId.slice(0, 8)}`;
    this.logger.debug(`[MockBilling] createCustomer → ${customerId}`);
    return customerId;
  }

  async createSubscription(
    customerId: string,
    tier: string,
    interval: BillingInterval,
    _paymentMethodId?: string,
  ): Promise<CreateExternalSubscriptionResult> {
    const result: CreateExternalSubscriptionResult = {
      externalSubscriptionId: `sub_mock_${uuidv4().slice(0, 12)}`,
      externalCustomerId: customerId,
    };
    this.logger.debug(
      `[MockBilling] createSubscription tier=${tier} interval=${interval} → ${result.externalSubscriptionId}`,
    );
    return result;
  }

  async cancelSubscription(
    externalSubscriptionId: string,
    immediately: boolean,
  ): Promise<CancelExternalSubscriptionResult> {
    this.logger.debug(
      `[MockBilling] cancelSubscription ${externalSubscriptionId} immediately=${immediately}`,
    );
    return { cancelled: true };
  }

  async charge(
    customerId: string,
    amountInCents: number,
    currency: string,
    description: string,
  ): Promise<ChargeResult> {
    this.logger.debug(
      `[MockBilling] charge customerId=${customerId} amount=${amountInCents} ${currency} — "${description}"`,
    );
    return {
      success: true,
      externalPaymentId: `pay_mock_${uuidv4().slice(0, 12)}`,
    };
  }
}
