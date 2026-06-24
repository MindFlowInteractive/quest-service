export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void' | 'overdue';

export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'paused';

export type BillingInterval = 'month' | 'year';

export type PaymentMethodType = 'card' | 'paypal' | 'bank_account';

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentData {
  amount: number;
  currency: string;
  userId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  paymentMethodId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  error?: string;
}

export interface PaymentProvider {
  processPayment(paymentData: PaymentData): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
  createSubscription(
    userId: string,
    planId: string,
    amount: number,
    currency: string,
    interval: BillingInterval,
    paymentMethodId?: string,
  ): Promise<SubscriptionResult>;
  cancelSubscription(externalSubscriptionId: string): Promise<{ success: boolean }>;
}
