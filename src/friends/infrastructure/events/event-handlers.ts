import { Injectable, Inject } from '@nestjs/common';
import {
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
  ActivityEventCreatedEvent,
} from '../../domain/entities/domain-event';
import {
  INotificationService,
  ICacheService,
  IActivityEventRepository,
} from '../../domain/repositories/repository-interfaces';
import { ActivityFeedService } from '../../application/services/activity-feed.service';
import { PrivacyLevel } from '../../domain/entities/domain-entities';

/**
 * Event handlers for domain events
 * These process asynchronously via message broker
 */
@Injectable()
export class FriendEventHandlers {
  constructor(
    @Inject('INotificationService')
    private notificationService: INotificationService,
    @Inject('ICacheService')
    private cacheService: ICacheService,
    @Inject('IActivityEventRepository')
    private activityEventRepo: IActivityEventRepository,
    private activityFeedService: ActivityFeedService,
  ) {}

  /**
   * Handle FriendRequestSentEvent
   * Send notification to recipient
   */
  async onFriendRequestSent(event: FriendRequestSentEvent): Promise<void> {
    try {
      // Check for idempotency using event ID
      const idempotencyKey = `event_handled_${event.eventId}`;
      const alreadyHandled = await this.cacheService.get<boolean>(idempotencyKey);

      if (alreadyHandled) {
        return; // Already processed
      }

      // Send notification
      await this.notificationService.sendFriendRequestNotification(
        event.toUserId,
        event.fromUserId,
        '', // Would fetch display name from user service
      );

      // Mark as handled
      await this.cacheService.set(idempotencyKey, true, 86400); // 24h TTL
    } catch (error) {
      console.error('Error handling FriendRequestSentEvent:', error);
      throw error; // Will be retried by message broker
    }
  }

  /**
   * Handle FriendRequestAcceptedEvent
   * Create mutual friendships and send notifications
   */
  async onFriendRequestAccepted(event: FriendRequestAcceptedEvent): Promise<void> {
    try {
      const idempotencyKey = `event_handled_${event.eventId}`;
      const alreadyHandled = await this.cacheService.get<boolean>(idempotencyKey);

      if (alreadyHandled) {
        return;
      }

      // Send notification to both users
      await Promise.all([
        this.notificationService.sendFriendRequestAcceptedNotification(
          event.toUserId,
          event.fromUserId,
          '',
        ),
        this.notificationService.sendFriendRequestAcceptedNotification(
          event.fromUserId,
          event.toUserId,
          '',
        ),
      ]);

      // Invalidate friend list caches
      await Promise.all([
        this.cacheService.del(`friendships:${event.fromUserId}`),
        this.cacheService.del(`friendships:${event.toUserId}`),
        this.cacheService.del(`friends:set:${event.fromUserId}`),
        this.cacheService.del(`friends:set:${event.toUserId}`),
      ]);

      // Mark as handled
      await this.cacheService.set(idempotencyKey, true, 86400);
    } catch (error) {
      console.error('Error handling FriendRequestAcceptedEvent:', error);
      throw error;
    }
  }

  /**
   * Handle ActivityEventCreatedEvent
   * Fan-out activity to friends' feeds
   */
  async onActivityEventCreated(event: ActivityEventCreatedEvent): Promise<void> {
    try {
      const idempotencyKey = `event_handled_${event.eventId}`;
      const alreadyHandled = await this.cacheService.get<boolean>(idempotencyKey);

      if (alreadyHandled) {
        return;
      }

      // Fan-out to friends' feeds
      await this.activityFeedService.fanOutActivityToFriends(
        event.actorUserId,
        event.eventId,
        event.visibility as PrivacyLevel,
      );

      // Mark as handled
      await this.cacheService.set(idempotencyKey, true, 86400);
    } catch (error) {
      console.error('Error handling ActivityEventCreatedEvent:', error);
      throw error;
    }
  }
}
