import {
  FriendRequest,
  Friendship,
  PrivacySettings,
  ActivityEvent,
  UserId,
} from '../entities/domain-entities';

/**
 * FriendRequest Repository Interface
 * Abstracts persistence of FriendRequest aggregates.
 */
export interface IFriendRequestRepository {
  save(friendRequest: FriendRequest): Promise<void>;
  findById(id: string): Promise<FriendRequest | null>;
  findByUsersPair(
    fromUserId: string,
    toUserId: string,
  ): Promise<FriendRequest | null>;
  findInboundByUserId(userId: string, limit: number): Promise<FriendRequest[]>;
  findOutboundByUserId(
    userId: string,
    limit: number,
  ): Promise<FriendRequest[]>;
  findByIds(ids: string[]): Promise<FriendRequest[]>;
  deletePermanently(id: string): Promise<void>;
}

/**
 * Friendship Repository Interface
 * Abstracts persistence of Friendship aggregates.
 */
export interface IFriendshipRepository {
  save(friendship: Friendship): Promise<void>;
  saveBatch(friendships: Friendship[]): Promise<void>;
  findById(id: string): Promise<Friendship | null>;
  findBothDirections(
    userId: string,
    friendId: string,
  ): Promise<Friendship[]>;
  findFriendsOfUser(userId: string, limit: number, offset?: number): Promise<Friendship[]>;
  findFriendCountByUserId(userId: string): Promise<number>;
  delete(userId: string, friendId: string): Promise<void>;
  deleteBatch(pairs: Array<{ userId: string; friendId: string }>): Promise<void>;
  exists(userId: string, friendId: string): Promise<boolean>;
  isFriend(userId: string, friendId: string): Promise<boolean>;
  getMutualFriendsCount(userId1: string, userId2: string): Promise<number>;
  getMutualFriendsIds(userId1: string, userId2: string, limit?: number): Promise<string[]>;
}

/**
 * PrivacySettings Repository Interface
 */
export interface IPrivacySettingsRepository {
  save(privacySettings: PrivacySettings): Promise<void>;
  findByUserId(userId: string): Promise<PrivacySettings | null>;
  findByUserIds(userIds: string[]): Promise<Map<string, PrivacySettings>>;
}

/**
 * ActivityEvent Repository Interface
 */
export interface IActivityEventRepository {
  save(event: ActivityEvent): Promise<void>;
  findById(id: string): Promise<ActivityEvent | null>;
  findByIds(ids: string[]): Promise<ActivityEvent[]>;
  findByActorUserId(
    actorUserId: string,
    limit: number,
    offset?: number,
  ): Promise<ActivityEvent[]>;
  findRecentByActorIds(
    actorUserIds: string[],
    limit: number,
  ): Promise<ActivityEvent[]>;
  countByActorUserId(actorUserId: string): Promise<number>;
}

/**
 * Block Repository Interface
 * Manages user blocks to prevent friend requests.
 */
export interface IBlockRepository {
  save(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(userId: string, targetUserId: string): Promise<boolean>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
}

/**
 * Event Store Interface
 * For event sourcing and eventual consistency.
 */
export interface IEventStore {
  append(event: any): Promise<void>;
  getEventsByAggregateId(aggregateId: string): Promise<any[]>;
  getEventsSince(id: any): Promise<any[]>;
}

/**
 * Cache Interface
 * Abstraction for caching layer (Redis).
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset(records: Array<{ key: string; value: any; ttl?: number }>): Promise<void>;
  sadd(key: string, members: string[]): Promise<number>;
  srem(key: string, members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;
  zadd(
    key: string,
    members: Array<{ score: number; member: string }>,
  ): Promise<number>;
  zrem(key: string, members: string[]): Promise<number>;
  zrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<(string | number)[]>;
  zrevrange(
    key: string,
    start: number,
    stop: number,
    withScores?: boolean,
  ): Promise<(string | number)[]>;
  zcard(key: string): Promise<number>;
  zcount(key: string, min: number, max: number): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  ttl(key: string): Promise<number>;
  zinterstore(
    destination: string,
    keys: string[],
  ): Promise<number>;
  zrangebyscore(
    key: string,
    min: number,
    max: number,
    limit?: { offset: number; count: number },
  ): Promise<string[]>;
}

/**
 * Message Broker Interface
 * For publishing domain events.
 */
export interface IMessageBroker {
  publish(topic: string, message: any, options?: { key?: string }): Promise<void>;
  subscribe(topic: string, handler: (message: any) => Promise<void>): Promise<void>;
}

/**
 * Notification Service Interface
 * For sending notifications.
 */
export interface INotificationService {
  sendFriendRequestNotification(
    toUserId: string,
    fromUserId: string,
    fromDisplayName: string,
  ): Promise<void>;
  sendFriendRequestAcceptedNotification(
    toUserId: string,
    fromUserId: string,
    fromDisplayName: string,
  ): Promise<void>;
  sendActivityNotification(
    recipientId: string,
    actorId: string,
    actorDisplayName: string,
    activity: string,
  ): Promise<void>;
}

/**
 * Event Publisher Interface
 * For publishing domain events for event handlers.
 */
export interface IEventPublisher {
  publishEvent(event: any): Promise<void>;
  subscribeToEvent(eventType: string, handler: (event: any) => Promise<void>): void;
}

/**
 * User Service Interface
 * For getting user information.
 */
export interface IUserService {
  getUserById(userId: string): Promise<{
    id: string;
    displayName: string;
    avatar?: string;
  } | null>;
  ungetUsersByIds(userIds: string[]): Promise<
    Array<{
      id: string;
      displayName: string;
      avatar?: string;
    }>
  >;
  checkUserExists(userId: string): Promise<boolean>;
  searchUsers(query: string, limit: number): Promise<
    Array<{
      id: string;
      displayName: string;
      avatar?: string;
    }>
  >;
}

/**
 * Leaderboard Service Interface
 * For getting leaderboard data.
 */
export interface ILeaderboardService {
  getTopScores(metric: string, limit: number): Promise<
    Array<{
      userId: string;
      score: number;
      rank: number;
    }>
  >;
  getUserScore(userId: string, metric: string): Promise<{
    score: number;
    rank: number;
  } | null>;
  updateScore(userId: string, metric: string, score: number): Promise<void>;
}
