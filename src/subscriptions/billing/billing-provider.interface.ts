import { BillingInterval } from '../enums/subscription.enums';

export interface ChargeResult {
  success: boolean;
  externalPaymentId?: string;
  failureReason?: string;
}

export interface CreateExternalSubscriptionResult {
  externalSubscriptionId: string;
  externalCustomerId: string;
}

export interface CancelExternalSubscriptionResult {
  cancelled: boolean;
}

export interface BillingProvider {
  /**
   * Create a customer record in the billing provider.
   */
  createCustomer(userId: string, email: string): Promise<string>;

  /**
   * Create a recurring subscription in the billing provider.
   */
  createSubscription(
    customerId: string,
    tier: string,
    interval: BillingInterval,
    paymentMethodId?: string,
  ): Promise<CreateExternalSubscriptionResult>;

  /**
   * Cancel a subscription in the billing provider.
   */
  cancelSubscription(
    externalSubscriptionId: string,
    immediately: boolean,
  ): Promise<CancelExternalSubscriptionResult>;

  /**
   * Charge a one-time amount (used for immediate tier upgrades / prorations).
   */
  charge(
    customerId: string,
    amountInCents: number,
    currency: string,
    description: string,
  ): Promise<ChargeResult>;
}

export const BILLING_PROVIDER = Symbol('BILLING_PROVIDER');
