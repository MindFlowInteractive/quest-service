import { Injectable, Logger } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { InvoiceService } from '../invoice/invoice.service';
import { StripePaymentProvider } from '../providers/stripe.provider';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly stripeProvider: StripePaymentProvider,
  ) {}

  async handleStripeWebhook(payload: Buffer, signature: string) {
    const event = this.stripeProvider.constructWebhookEvent(payload, signature);

    if (!event) {
      return this.handleMockWebhook(payload);
    }

    this.logger.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as { id: string };
        await this.paymentService.updatePaymentStatus(
          paymentIntent.id,
          'completed',
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as { id: string };
        await this.paymentService.updatePaymentStatus(
          paymentIntent.id,
          'failed',
        );
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          id: string;
          status: string;
        };
        const statusMap: Record<string, 'active' | 'cancelled' | 'past_due' | 'paused'> = {
          active: 'active',
          canceled: 'cancelled',
          past_due: 'past_due',
          paused: 'paused',
        };
        const mappedStatus = statusMap[subscription.status] ?? 'active';
        await this.subscriptionService.updateStatus(
          subscription.id,
          mappedStatus,
        );
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as {
          id: string;
          metadata?: { invoiceNumber?: string };
        };
        if (invoice.metadata?.invoiceNumber) {
          const localInvoice = await this.invoiceService.findByInvoiceNumber(
            invoice.metadata.invoiceNumber,
          );
          if (localInvoice) {
            await this.invoiceService.markAsPaid(localInvoice.id);
          }
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true, eventType: event.type };
  }

  private async handleMockWebhook(payload: Buffer) {
    try {
      const body = JSON.parse(payload.toString()) as {
        type: string;
        data?: {
          transactionId?: string;
          subscriptionId?: string;
          invoiceNumber?: string;
          status?: string;
        };
      };

      this.logger.log(`Processing mock webhook: ${body.type}`);

      switch (body.type) {
        case 'payment_intent.succeeded':
          if (body.data?.transactionId) {
            await this.paymentService.updatePaymentStatus(
              body.data.transactionId,
              'completed',
            );
          }
          break;
        case 'payment_intent.payment_failed':
          if (body.data?.transactionId) {
            await this.paymentService.updatePaymentStatus(
              body.data.transactionId,
              'failed',
            );
          }
          break;
        case 'customer.subscription.updated':
          if (body.data?.subscriptionId && body.data?.status) {
            await this.subscriptionService.updateStatus(
              body.data.subscriptionId,
              body.data.status as 'active' | 'cancelled' | 'past_due' | 'paused',
            );
          }
          break;
        case 'invoice.paid':
          if (body.data?.invoiceNumber) {
            const invoice = await this.invoiceService.findByInvoiceNumber(
              body.data.invoiceNumber,
            );
            if (invoice) {
              await this.invoiceService.markAsPaid(invoice.id);
            }
          }
          break;
      }

      return { received: true, eventType: body.type, mode: 'mock' };
    } catch (error) {
      this.logger.error('Failed to parse mock webhook payload', error);
      return { received: false, error: 'Invalid webhook payload' };
    }
  }
}
