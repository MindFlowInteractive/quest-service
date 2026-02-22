/**
 * Value Objects for the Friend System
 * Immutable objects representing concepts in the domain.
 */

/**
 * UserId value object
 */
export class UserId {
  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    this.value = value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * FriendRequestState - State machine for friend requests
 */
export enum FriendRequestState {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  BLOCKED = 'blocked',
}

/**
 * PrivacyLevel - Visibility control
 */
export enum PrivacyLevel {
  PUBLIC = 'PUBLIC',
  FRIENDS_ONLY = 'FRIENDS_ONLY',
  PRIVATE = 'PRIVATE',
}

/**
 * ActivityEventType
 */
export enum ActivityEventType {
  GAME_PLAYED = 'game_played',
  SCORE_ACHIEVED = 'score_achieved',
  STATUS_UPDATE = 'status_update',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  TOURNAMENT_FINISHED = 'tournament_finished',
}

/**
 * FriendRequest Aggregate Root
 */
export class FriendRequest {
  readonly id: string;
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  state: FriendRequestState;
  readonly message: string | null;
  readonly createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
  expiresAt: Date | null;
  readonly metadata: Record<string, any>;
  private uncommittedEvents: any[] = [];

  constructor(params: {
    id: string;
    fromUserId: UserId;
    toUserId: UserId;
    state: FriendRequestState;
    message?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    respondedAt?: Date | null;
    expiresAt?: Date | null;
    metadata?: Record<string, any>;
  }) {
    this.id = params.id;
    this.fromUserId = params.fromUserId;
    this.toUserId = params.toUserId;
    this.state = params.state;
    this.message = params.message || null;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
    this.respondedAt = params.respondedAt || null;
    this.expiresAt = params.expiresAt || null;
    this.metadata = params.metadata || {};
  }

  /**
   * Check if request can be accepted
   */
  canAccept(): boolean {
    return this.state === FriendRequestState.PENDING && !this.isExpired();
  }

  /**
   * Check if request can be rejected
   */
  canReject(): boolean {
    return this.state === FriendRequestState.PENDING && !this.isExpired();
  }

  /**
   * Check if request has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Accept the request
   */
  accept(): void {
    if (!this.canAccept()) {
      throw new Error(
        `Cannot accept friend request in state: ${this.state}`,
      );
    }
    this.state = FriendRequestState.ACCEPTED;
    this.respondedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Reject the request
   */
  reject(): void {
    if (!this.canReject()) {
      throw new Error(
        `Cannot reject friend request in state: ${this.state}`,
      );
    }
    this.state = FriendRequestState.REJECTED;
    this.respondedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Cancel the request (only by sender)
   */
  cancel(): void {
    if (this.state !== FriendRequestState.PENDING) {
      throw new Error(
        `Cannot cancel friend request in state: ${this.state}`,
      );
    }
    this.state = FriendRequestState.CANCELLED;
    this.respondedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark as blocked
   */
  markAsBlocked(): void {
    this.state = FriendRequestState.BLOCKED;
    this.updatedAt = new Date();
  }

  /**
   * Get uncommitted domain events
   */
  getUncommittedEvents(): any[] {
    return this.uncommittedEvents;
  }

  /**
   * Add uncommitted domain event
   */
  addUncommittedEvent(event: any): void {
    this.uncommittedEvents.push(event);
  }

  /**
   * Clear uncommitted events
   */
  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}

/**
 * Friendship Aggregate Root
 */
export class Friendship {
  readonly id: string;
  readonly userId: UserId;
  readonly friendId: UserId;
  readonly createdAt: Date;
  updatedAt: Date;
  readonly metadata: Record<string, any>;
  private uncommittedEvents: any[] = [];

  constructor(params: {
    id: string;
    userId: UserId;
    friendId: UserId;
    createdAt?: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
  }) {
    this.id = params.id;
    this.userId = params.userId;
    this.friendId = params.friendId;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
    this.metadata = params.metadata || {};
  }

  getUncommittedEvents(): any[] {
    return this.uncommittedEvents;
  }

  addUncommittedEvent(event: any): void {
    this.uncommittedEvents.push(event);
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }
}

/**
 * PrivacySettings Aggregate Root
 */
export class PrivacySettings {
  readonly userId: UserId;
  profileVisibility: PrivacyLevel;
  showActivityTo: PrivacyLevel;
  leaderboardVisibility: PrivacyLevel;
  readonly createdAt: Date;
  updatedAt: Date;
  readonly metadata: Record<string, any>;

  constructor(params: {
    userId: UserId;
    profileVisibility?: PrivacyLevel;
    showActivityTo?: PrivacyLevel;
    leaderboardVisibility?: PrivacyLevel;
    createdAt?: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
  }) {
    this.userId = params.userId;
    this.profileVisibility = params.profileVisibility || PrivacyLevel.PUBLIC;
    this.showActivityTo = params.showActivityTo || PrivacyLevel.FRIENDS_ONLY;
    this.leaderboardVisibility =
      params.leaderboardVisibility || PrivacyLevel.PUBLIC;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
    this.metadata = params.metadata || {};
  }

  /**
   * Check if activity is visible to viewer
   */
  isActivityVisibleTo(viewerId: UserId): boolean {
    if (this.userId.equals(viewerId)) return true;
    if (this.showActivityTo === PrivacyLevel.PUBLIC) return true;
    return false; // FRIENDS_ONLY / PRIVATE need additional checks
  }

  /**
   * Check if profile is visible to viewer
   */
  isProfileVisibleTo(viewerId: UserId): boolean {
    if (this.userId.equals(viewerId)) return true;
    if (this.profileVisibility === PrivacyLevel.PUBLIC) return true;
    return false; // FRIENDS_ONLY / PRIVATE need additional checks
  }

  /**
   * Check if leaderboard entry is visible to viewer
   */
  isLeaderboardVisibleTo(viewerId: UserId): boolean {
    if (this.userId.equals(viewerId)) return true;
    if (this.leaderboardVisibility === PrivacyLevel.PUBLIC) return true;
    return false; // FRIENDS_ONLY / PRIVATE need additional checks
  }
}

/**
 * ActivityEvent Aggregate Root
 */
export class ActivityEvent {
  readonly id: string;
  readonly actorUserId: UserId;
  readonly eventType: ActivityEventType;
  readonly payload: Record<string, any>;
  readonly visibility: PrivacyLevel;
  readonly createdAt: Date;
  deletedAt: Date | null;
  readonly metadata: Record<string, any>;

  constructor(params: {
    id: string;
    actorUserId: UserId;
    eventType: ActivityEventType;
    payload: Record<string, any>;
    visibility?: PrivacyLevel;
    createdAt?: Date;
    deletedAt?: Date | null;
    metadata?: Record<string, any>;
  }) {
    this.id = params.id;
    this.actorUserId = params.actorUserId;
    this.eventType = params.eventType;
    this.payload = params.payload;
    this.visibility = params.visibility || PrivacyLevel.PUBLIC;
    this.createdAt = params.createdAt || new Date();
    this.deletedAt = params.deletedAt || null;
    this.metadata = params.metadata || {};
  }

  /**
   * Soft delete the activity
   */
  delete(): void {
    this.deletedAt = new Date();
  }

  /**
   * Check if activity is deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
