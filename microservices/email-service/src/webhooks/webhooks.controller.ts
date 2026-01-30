import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrackingService } from '../tracking/tracking.service';
import { UnsubscribeService } from '../unsubscribe/unsubscribe.service';
import { EmailsService } from '../emails/emails.service';
import { TrackingEventType, BounceType } from '../tracking/entities/email-tracking-event.entity';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_message_id: string;
  url?: string;
  reason?: string;
  type?: string;
  bounce_classification?: string;
}

interface SESNotification {
  Type: string;
  Message: string;
  MessageId: string;
  TopicArn?: string;
  Timestamp: string;
}

interface SESBounce {
  bounceType: string;
  bounceSubType: string;
  bouncedRecipients: Array<{ emailAddress: string }>;
  timestamp: string;
}

interface SESComplaint {
  complainedRecipients: Array<{ emailAddress: string }>;
  complaintFeedbackType?: string;
  timestamp: string;
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly trackingService: TrackingService,
    private readonly unsubscribeService: UnsubscribeService,
    private readonly emailsService: EmailsService,
  ) {}

  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  async handleSendGridWebhook(
    @Body() events: SendGridEvent[],
    @Headers('x-twilio-email-event-webhook-signature') signature: string,
  ) {
    this.logger.log(`Received ${events.length} SendGrid webhook events`);

    for (const event of events) {
      try {
        await this.processSendGridEvent(event);
      } catch (error) {
        this.logger.error(`Error processing SendGrid event: ${error.message}`);
      }
    }

    return { received: true };
  }

  @Post('ses')
  @HttpCode(HttpStatus.OK)
  async handleSESWebhook(@Body() notification: SESNotification) {
    this.logger.log(`Received SES webhook: ${notification.Type}`);

    if (notification.Type === 'SubscriptionConfirmation') {
      this.logger.log('SES subscription confirmation received');
      return { received: true };
    }

    if (notification.Type === 'Notification') {
      try {
        const message = JSON.parse(notification.Message);
        await this.processSESNotification(message);
      } catch (error) {
        this.logger.error(`Error processing SES notification: ${error.message}`);
      }
    }

    return { received: true };
  }

  private async processSendGridEvent(event: SendGridEvent): Promise<void> {
    const email = await this.findEmailByMessageId(event.sg_message_id);
    if (!email) {
      this.logger.warn(`Email not found for message ID: ${event.sg_message_id}`);
      return;
    }

    const baseData = {
      emailId: email.id,
      messageId: event.sg_message_id,
      provider: 'sendgrid',
      rawEvent: event,
    };

    switch (event.event) {
      case 'delivered':
        await this.trackingService.trackDelivery(baseData);
        break;

      case 'open':
        await this.trackingService.trackOpen(baseData);
        break;

      case 'click':
        await this.trackingService.trackClick({ ...baseData, url: event.url });
        break;

      case 'bounce':
        await this.trackingService.trackBounce({
          ...baseData,
          bounceType: this.mapSendGridBounceType(event.type),
          bounceReason: event.reason,
        });
        await this.unsubscribeService.addBounce(event.email, event.reason);
        break;

      case 'spamreport':
        await this.trackingService.trackComplaint({
          ...baseData,
          complaintType: 'spam',
        });
        await this.unsubscribeService.addComplaint(event.email);
        break;

      case 'unsubscribe':
        await this.trackingService.trackUnsubscribe(baseData);
        await this.unsubscribeService.unsubscribe({ email: event.email });
        break;

      case 'dropped':
        await this.trackingService.trackEvent(TrackingEventType.DROPPED, {
          ...baseData,
          bounceReason: event.reason,
        });
        break;

      case 'deferred':
        await this.trackingService.trackEvent(TrackingEventType.DEFERRED, {
          ...baseData,
          bounceReason: event.reason,
        });
        break;
    }
  }

  private async processSESNotification(message: any): Promise<void> {
    const notificationType = message.notificationType;
    const mail = message.mail;

    if (!mail?.messageId) {
      return;
    }

    const email = await this.findEmailByMessageId(mail.messageId);
    if (!email) {
      this.logger.warn(`Email not found for SES message ID: ${mail.messageId}`);
      return;
    }

    const baseData = {
      emailId: email.id,
      messageId: mail.messageId,
      provider: 'ses',
      rawEvent: message,
    };

    switch (notificationType) {
      case 'Delivery':
        await this.trackingService.trackDelivery(baseData);
        break;

      case 'Bounce':
        const bounce = message.bounce as SESBounce;
        for (const recipient of bounce.bouncedRecipients) {
          await this.trackingService.trackBounce({
            ...baseData,
            bounceType: this.mapSESBounceType(bounce.bounceType),
            bounceReason: bounce.bounceSubType,
          });
          await this.unsubscribeService.addBounce(
            recipient.emailAddress,
            `${bounce.bounceType}: ${bounce.bounceSubType}`,
          );
        }
        break;

      case 'Complaint':
        const complaint = message.complaint as SESComplaint;
        for (const recipient of complaint.complainedRecipients) {
          await this.trackingService.trackComplaint({
            ...baseData,
            complaintType: complaint.complaintFeedbackType,
          });
          await this.unsubscribeService.addComplaint(recipient.emailAddress);
        }
        break;
    }
  }

  private async findEmailByMessageId(messageId: string) {
    try {
      return await this.emailsService.findByMessageId(messageId);
    } catch {
      return null;
    }
  }

  private mapSendGridBounceType(type?: string): BounceType {
    switch (type) {
      case 'bounce':
        return BounceType.HARD;
      case 'blocked':
        return BounceType.SOFT;
      default:
        return BounceType.TRANSIENT;
    }
  }

  private mapSESBounceType(type: string): BounceType {
    switch (type) {
      case 'Permanent':
        return BounceType.HARD;
      case 'Transient':
        return BounceType.SOFT;
      default:
        return BounceType.TRANSIENT;
    }
  }
}
