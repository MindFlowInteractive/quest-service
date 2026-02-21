import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import {
  BlockchainTransaction,
  TransactionStatus,
} from '../entities/blockchain-transaction.entity';
import { TransactionEvent, TransactionAlert } from '../interfaces/transaction-event.interface';

@Injectable()
export class TransactionNotificationService {
  private readonly logger = new Logger(TransactionNotificationService.name);

  constructor(
    @InjectRepository(BlockchainTransaction)
    private transactionRepository: Repository<BlockchainTransaction>,
  ) {}

  /**
   * Handle transaction created events
   */
  @OnEvent('blockchain.transaction')
  async handleTransactionEvent(event: TransactionEvent): Promise<void> {
    this.logger.log(`Received transaction event: ${event.eventType} for ${event.transactionHash}`);

    switch (event.eventType) {
      case 'transaction_created':
        await this.handleTransactionCreated(event);
        break;
      case 'transaction_confirmed':
        await this.handleTransactionConfirmed(event);
        break;
      case 'transaction_failed':
        await this.handleTransactionFailed(event);
        break;
      case 'transaction_retry':
        await this.handleTransactionRetry(event);
        break;
    }
  }

  /**
   * Handle alert events
   */
  @OnEvent('blockchain.alert')
  async handleAlertEvent(alert: TransactionAlert): Promise<void> {
    this.logger.warn(`Alert received: ${alert.alertType} - ${alert.message}`);

    // Log critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      // TODO: Send to monitoring service (PagerDuty, OpsGenie, etc.)
      this.logger.error(`CRITICAL ALERT: ${alert.message}`);
    }

    // TODO: Send notifications to admins for high/critical alerts
    // This could be email, Slack, Discord, etc.
  }

  /**
   * Handle transaction created
   */
  private async handleTransactionCreated(event: TransactionEvent): Promise<void> {
    if (!event.userId) return;

    // Notify user that transaction is being processed
    await this.sendNotification({
      userId: event.userId,
      type: 'transaction_pending',
      title: 'Transaction Submitted',
      message: `Your ${event.type} transaction has been submitted and is being processed.`,
      transactionHash: event.transactionHash,
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Handle transaction confirmed
   */
  private async handleTransactionConfirmed(event: TransactionEvent): Promise<void> {
    if (!event.userId) return;

    const amount = event.data.amount ? `${event.data.amount} ${event.data.assetCode || 'XLM'}` : '';
    
    await this.sendNotification({
      userId: event.userId,
      type: 'transaction_confirmed',
      title: 'Transaction Confirmed',
      message: amount
        ? `Your transaction of ${amount} has been confirmed on the blockchain.`
        : 'Your transaction has been confirmed on the blockchain.',
      transactionHash: event.transactionHash,
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Handle transaction failed
   */
  private async handleTransactionFailed(event: TransactionEvent): Promise<void> {
    if (!event.userId) return;

    const retryMessage = event.data.retryCount && event.data.retryCount > 0
      ? ` We will retry automatically (${event.data.retryCount} attempts so far).`
      : '';

    await this.sendNotification({
      userId: event.userId,
      type: 'transaction_failed',
      title: 'Transaction Failed',
      message: `Your transaction failed.${retryMessage} Error: ${event.data.errorMessage || 'Unknown error'}`,
      transactionHash: event.transactionHash,
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Handle transaction retry
   */
  private async handleTransactionRetry(event: TransactionEvent): Promise<void> {
    if (!event.userId) return;

    await this.sendNotification({
      userId: event.userId,
      type: 'transaction_pending',
      title: 'Transaction Retry',
      message: `Your transaction is being retried (attempt ${event.data.retryCount}).`,
      transactionHash: event.transactionHash,
      timestamp: new Date(),
      read: false,
    });
  }

  /**
   * Handle permanent failure
   */
  @OnEvent('blockchain.transaction.failed_permanently')
  async handlePermanentFailure(event: {
    transactionHash: string;
    userId?: string;
    type: string;
    category: string;
    error: string;
    timestamp: Date;
  }): Promise<void> {
    this.logger.error(`Permanent failure for transaction ${event.transactionHash}: ${event.error}`);

    if (event.userId) {
      await this.sendNotification({
        userId: event.userId,
        type: 'transaction_failed',
        title: 'Transaction Failed Permanently',
        message: `Your ${event.type} transaction failed after multiple retry attempts. Please contact support.`,
        transactionHash: event.transactionHash,
        timestamp: new Date(),
        read: false,
      });
    }

    // TODO: Send alert to support team for manual intervention
  }

  /**
   * Send notification (placeholder - integrate with your notification service)
   */
  private async sendNotification(notification: {
    userId: string;
    type: 'transaction_confirmed' | 'transaction_failed' | 'transaction_pending';
    title: string;
    message: string;
    transactionHash: string;
    timestamp: Date;
    read: boolean;
  }): Promise<void> {
    // TODO: Integrate with your notification service
    // This could be:
    // - In-app notifications
    // - Push notifications (FCM)
    // - Email notifications
    // - WebSocket events for real-time updates

    this.logger.log(`Notification for user ${notification.userId}: ${notification.title} - ${notification.message}`);

    // Example: Emit WebSocket event for real-time updates
    // this.websocketGateway.sendToUser(notification.userId, 'transaction_notification', notification);

    // Example: Store notification in database
    // await this.notificationRepository.save(notification);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
    // TODO: Implement based on your notification storage
    // This is a placeholder
    return [];
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    // TODO: Implement based on your notification storage
  }

  /**
   * Send bulk notification (for admins)
   */
  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string
  ): Promise<void> {
    for (const userId of userIds) {
      await this.sendNotification({
        userId,
        type: 'transaction_confirmed',
        title,
        message,
        transactionHash: '',
        timestamp: new Date(),
        read: false,
      });
    }
  }
}
