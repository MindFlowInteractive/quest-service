import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ActivityEvent, ActivityEventType, PrivacyLevel, UserId } from '../../domain/entities/domain-entities';
import {
  IActivityEventRepository,
  ICacheService,
  IFriendshipRepository,
  IEventPublisher,
} from '../../domain/repositories/repository-interfaces';
import { ActivityEventCreatedEvent } from '../../domain/entities/domain-event';
import { PrivacyService } from './privacy.service';

@Injectable()
export class ActivityFeedService {
  constructor(
    @Inject('IActivityEventRepository')
    private activityEventRepo: IActivityEventRepository,
    @Inject('ICacheService')
    private cacheService: ICacheService,
    @Inject('IFriendshipRepository')
    private friendshipRepo: IFriendshipRepository,
    @Inject('IEventPublisher')
    private eventPublisher: IEventPublisher,
    private privacyService: PrivacyService,
  ) {}

  /**
   * Create and record an activity event.
   * This triggers fan-out to friends' feeds.
   */
  async recordActivity(
    actorUserId: string,
    eventType: ActivityEventType,
    payload: Record<string, any>,
    visibility: PrivacyLevel = PrivacyLevel.PUBLIC,
    correlationId: string = uuidv4(),
  ): Promise<ActivityEvent> {
    const eventId = uuidv4();

    const activityEvent = new ActivityEvent({
      id: eventId,
      actorUserId: new UserId(actorUserId),
      eventType,
      payload,
      visibility,
    });

    // Save to authoritative store
    await this.activityEventRepo.save(activityEvent);

    // Publish domain event for async consumers (feed fan-out, notifications, etc)
    const idempotencyKey = `activity_created_${eventId}_${Date.now()}`;
    const domainEvent = new ActivityEventCreatedEvent(
      actorUserId,
      eventType,
      payload,
      visibility,
      {
        eventId: uuidv4(),
        correlationId,
        idempotencyKey,
      },
    );

    await this.eventPublisher.publishEvent(domainEvent);

    return activityEvent;
  }

  /**
   * Get activity feed for a user.
   * Combines recent activities from friends with caching.
   * Uses cursor-based pagination.
   */
  async getActivityFeed(
    userId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{
    events: ActivityEvent[];
    nextCursor: string | null;
  }> {
    // Decode cursor if provided
    let lastScore: number = Date.now();
    let lastId: string | null = null;

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
        lastScore = decoded.lastScore;
        lastId = decoded.lastId;
      } catch (e) {
        // Invalid cursor, start from beginning
      }
    }

    // Get user's friends
    const friendships = await this.friendshipRepo.findFriendsOfUser(userId, 10000);
    const friendIds = friendships.map((f) => f.friendId.value);

    if (friendIds.length === 0) {
      return { events: [], nextCursor: null };
    }

    // Try to get from cache first (fan-out-on-write format)
    const cacheKey = `feed:user:${userId}`;
    let feedEventIds = await this.cacheService.zrevrange(
      cacheKey,
      0,
      limit * 2 - 1,
      false,
    ) as string[];

    // If cache miss, fetch from DB and populate
    if (feedEventIds.length === 0) {
      const events = await this.activityEventRepo.findRecentByActorIds(
        friendIds,
        limit * 2,
      );
      feedEventIds = events.map((e) => e.id);

      // Populate cache
      if (feedEventIds.length > 0) {
        const members = events.map((e) => ({
          score: e.createdAt.getTime(),
          member: e.id,
        }));
        await this.cacheService.zadd(cacheKey, members);
        await this.cacheService.expire(cacheKey, 300); // 5 min TTL
      }
    }

    // Slice based on cursor
    let slicedIds = feedEventIds;
    if (lastId) {
      const lastIdIndex = slicedIds.indexOf(lastId);
      if (lastIdIndex >= 0) {
        slicedIds = slicedIds.slice(lastIdIndex + 1);
      }
    }

    slicedIds = slicedIds.slice(0, limit + 1);

    if (slicedIds.length === 0) {
      return { events: [], nextCursor: null };
    }

    // Fetch full event details
    const events = await this.activityEventRepo.findByIds(slicedIds.slice(0, limit));

    // Filter by visibility
    const filtered: ActivityEvent[] = [];
    for (const event of events) {
      const isVisible = await this.privacyService.isActivityVisible(
        event.actorUserId.value,
        userId,
      );
      if (isVisible && !event.isDeleted()) {
        filtered.push(event);
      }
    }

    // Prepare next cursor
    let nextCursor: string | null = null;
    if (slicedIds.length > limit) {
      const lastEvent = events[events.length - 1];
      if (lastEvent) {
        nextCursor = Buffer.from(
          JSON.stringify({
            lastScore: lastEvent.createdAt.getTime(),
            lastId: lastEvent.id,
          }),
        ).toString('base64');
      }
    }

    return { events: filtered, nextCursor };
  }

  /**
   * Fan-out activity to friends' feed caches (called async by event handler).
   */
  async fanOutActivityToFriends(
    actorUserId: string,
    eventId: string,
    visibility: PrivacyLevel,
  ): Promise<void> {
    if (visibility === PrivacyLevel.PRIVATE) {
      return; // Don't fan out private activities
    }

    // Get actor's friends
    const friendships = await this.friendshipRepo.findFriendsOfUser(actorUserId, 10000);

    if (friendships.length === 0) {
      return;
    }

    // Add event to each friend's feed cache
    const score = Date.now();
    const promises: Promise<void>[] = [];

    for (const friendship of friendships) {
      const friendId = friendship.friendId.value;
      const cacheKey = `feed:user:${friendId}`;

      // Check visibility settings of friend before adding
      if (visibility === PrivacyLevel.FRIENDS_ONLY) {
        // Activity is only visible to friends, so we add it
        promises.push(
          this.cacheService
            .zadd(cacheKey, [{ score, member: eventId }])
            .then(() => this.cacheService.expire(cacheKey, 300)),
        );
      } else {
        // PUBLIC - add to all friends' feeds
        promises.push(
          this.cacheService
            .zadd(cacheKey, [{ score, member: eventId }])
            .then(() => this.cacheService.expire(cacheKey, 300)),
        );
      }
    }

    // Also add to own feed
    const ownCacheKey = `feed:user:${actorUserId}`;
    promises.push(
      this.cacheService
        .zadd(ownCacheKey, [{ score, member: eventId }])
        .then(() => this.cacheService.expire(ownCacheKey, 300)),
    );

    await Promise.all(promises);
  }

  /**
   * Remove activity from all feed caches (soft delete).
   */
  async removeActivityFromFeeds(eventId: string): Promise<void> {
    // This would require knowing all users whose feeds contain this event.
    // For now, just let TTL expire and allow manual cleanup jobs.
    // In production, maintain reverse index of event -> users.
  }

  /**
   * Get activity by ID with privacy enforcement.
   */
  async getActivityEvent(
    eventId: string,
    viewerId: string,
  ): Promise<ActivityEvent | null> {
    const event = await this.activityEventRepo.findById(eventId);

    if (!event || event.isDeleted()) {
      return null;
    }

    // Check visibility
    const isVisible = await this.privacyService.isActivityVisible(
      event.actorUserId.value,
      viewerId,
    );

    return isVisible ? event : null;
  }

  /**
   * Batch get activity events.
   */
  async getActivityEventsBatch(
    eventIds: string[],
    viewerId: string,
  ): Promise<ActivityEvent[]> {
    const events = await this.activityEventRepo.findByIds(eventIds);

    const filtered: ActivityEvent[] = [];
    for (const event of events) {
      if (event.isDeleted()) continue;
      const isVisible = await this.privacyService.isActivityVisible(
        event.actorUserId.value,
        viewerId,
      );
      if (isVisible) {
        filtered.push(event);
      }
    }

    return filtered;
  }

  /**
   * Get activity summary for a user (stats).
   */
  async getActivityStats(userId: string): Promise<{
    recentActivityCount: number;
    eventTypes: Record<string, number>;
  }> {
    const count = await this.activityEventRepo.countByActorUserId(userId);

    // Could expand to include event type breakdown from a summary cache
    return {
      recentActivityCount: count,
      eventTypes: {},
    };
  }
}
