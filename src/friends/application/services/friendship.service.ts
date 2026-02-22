import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Friendship, UserId } from '../../domain/entities/domain-entities';
import {
  FriendshipNotFoundException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/domain-exceptions';
import {
  IFriendshipRepository,
  ICacheService,
  IEventPublisher,
} from '../../domain/repositories/repository-interfaces';
import { FriendRemovedEvent } from '../../domain/entities/domain-event';

@Injectable()
export class FriendshipService {
  constructor(
    @Inject('IFriendshipRepository')
    private friendshipRepo: IFriendshipRepository,
    @Inject('ICacheService')
    private cacheService: ICacheService,
    @Inject('IEventPublisher')
    private eventPublisher: IEventPublisher,
  ) {}

  /**
   * Remove a friendship (unfriend).
   * Removes both directed edges.
   */
  async removeFriend(
    userId: string,
    friendId: string,
    correlationId: string = uuidv4(),
  ): Promise<void> {
    // Verify friendship exists
    const friendships = await this.friendshipRepo.findBothDirections(
      userId,
      friendId,
    );

    if (friendships.length === 0) {
      throw new FriendshipNotFoundException(userId, friendId);
    }

    // Delete both directed friendships
    await this.friendshipRepo.delete(userId, friendId);
    await this.friendshipRepo.delete(friendId, userId);

    // Publish domain event
    const idempotencyKey = `friend_removed_${userId}_${friendId}_${Date.now()}`;
    const event = new FriendRemovedEvent(userId, friendId, {
      eventId: uuidv4(),
      correlationId,
      idempotencyKey,
    });

    await this.eventPublisher.publishEvent(event);

    // Invalidate caches
    await Promise.all([
      this.cacheService.del(`friendships:${userId}`),
      this.cacheService.del(`friendships:${friendId}`),
      this.cacheService.del(`friends:set:${userId}`),
      this.cacheService.del(`friends:set:${friendId}`),
      this.cacheService.del(`feed:user:${userId}`),
      this.cacheService.del(`feed:user:${friendId}`),
    ]);
  }

  /**
   * Get friends of a user with pagination.
   */
  async getFriends(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Friendship[]> {
    return this.friendshipRepo.findFriendsOfUser(userId, limit, offset);
  }

  /**
   * Get friend count for a user.
   */
  async getFriendCount(userId: string): Promise<number> {
    return this.friendshipRepo.findFriendCountByUserId(userId);
  }

  /**
   * Check if two users are friends.
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    return this.friendshipRepo.isFriend(userId, friendId);
  }

  /**
   * Get mutual friends between two users.
   */
  async getMutualFriendsCount(userId: string, otherId: string): Promise<number> {
    return this.friendshipRepo.getMutualFriendsCount(userId, otherId);
  }

  /**
   * Get mutual friends IDs.
   */
  async getMutualFriendsIds(
    userId: string,
    otherId: string,
    limit?: number,
  ): Promise<string[]> {
    return this.friendshipRepo.getMutualFriendsIds(userId, otherId, limit);
  }

  /**
   * Populate friend set cache.
   * Called periodically to ensure cache is fresh.
   */
  async cacheFriendSet(userId: string, ttl: number = 3600): Promise<void> {
    const friendships = await this.friendshipRepo.findFriendsOfUser(
      userId,
      10000,
    );
    const friendIds = friendships.map((f) => f.friendId.value);

    if (friendIds.length > 0) {
      await this.cacheService.sadd(`friends:set:${userId}`, friendIds);
      await this.cacheService.expire(`friends:set:${userId}`, ttl);
    }
  }

  /**
   * Get cached friend set or populate if missing.
   */
  async getFriendSet(userId: string): Promise<Set<string>> {
    const cached = await this.cacheService.smembers(`friends:set:${userId}`);

    if (cached.length > 0) {
      return new Set(cached);
    }

    // Cache miss, populate
    await this.cacheFriendSet(userId, 3600);
    const friendships = await this.friendshipRepo.findFriendsOfUser(
      userId,
      10000,
    );
    return new Set(friendships.map((f) => f.friendId.value));
  }

  /**
   * Batch check friendships.
   */
  async checkFriendshipsBatch(
    userId: string,
    potentialFriendsIds: string[],
  ): Promise<Map<string, boolean>> {
    const friendSet = await this.getFriendSet(userId);
    const result = new Map<string, boolean>();

    for (const potentialFriendId of potentialFriendsIds) {
      result.set(potentialFriendId, friendSet.has(potentialFriendId));
    }

    return result;
  }
}
