/**
 * Base class for domain events.
 * Used for eventual-consistency and cross-service communication.
 */
export abstract class DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly timestamp: Date;
  readonly correlationId: string;
  readonly idempotencyKey: string;
  readonly version: number;

  constructor(params: {
    eventId: string;
    aggregateId: string;
    aggregateType: string;
    timestamp?: Date;
    correlationId: string;
    idempotencyKey: string;
    version?: number;
  }) {
    this.eventId = params.eventId;
    this.aggregateId = params.aggregateId;
    this.aggregateType = params.aggregateType;
    this.timestamp = params.timestamp || new Date();
    this.correlationId = params.correlationId;
    this.idempotencyKey = params.idempotencyKey;
    this.version = params.version || 1;
  }

  abstract getEventType(): string;
}

/**
 * Friend Request Sent event
 * Occurs when a user sends a friend request to another user.
 */
export class FriendRequestSentEvent extends DomainEvent {
  constructor(
    readonly fromUserId: string,
    readonly toUserId: string,
    readonly message: string | null,
    params: {
      eventId: string;
      correlationId: string;
      idempotencyKey: string;
      timestamp?: Date;
    },
  ) {
    super({
      ...params,
      aggregateId: fromUserId,
      aggregateType: 'FriendRequest',
    });
  }

  getEventType(): string {
    return 'FriendRequestSent';
  }
}

/**
 * Friend Request Accepted event
 * Occurs when a friend request is accepted, creating mutual friendship.
 */
export class FriendRequestAcceptedEvent extends DomainEvent {
  constructor(
    readonly fromUserId: string,
    readonly toUserId: string,
    params: {
      eventId: string;
      correlationId: string;
      idempotencyKey: string;
      timestamp?: Date;
    },
  ) {
    super({
      ...params,
      aggregateId: toUserId,
      aggregateType: 'FriendRequest',
    });
  }

  getEventType(): string {
    return 'FriendRequestAccepted';
  }
}

/**
 * Friend Request Rejected event
 */
export class FriendRequestRejectedEvent extends DomainEvent {
  constructor(
    readonly fromUserId: string,
    readonly toUserId: string,
    params: {
      eventId: string;
      correlationId: string;
      idempotencyKey: string;
      timestamp?: Date;
    },
  ) {
    super({
      ...params,
      aggregateId: toUserId,
      aggregateType: 'FriendRequest',
    });
  }

  getEventType(): string {
    return 'FriendRequestRejected';
  }
}

/**
 * Friend Removed event
 * Occurs when a friendship is dissolved (unfriend).
 */
export class FriendRemovedEvent extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly friendId: string,
    params: {
      eventId: string;
      correlationId: string;
      idempotencyKey: string;
      timestamp?: Date;
    },
  ) {
    super({
      ...params,
      aggregateId: userId,
      aggregateType: 'Friendship',
    });
  }

  getEventType(): string {
    return 'FriendRemoved';
  }
}

/**
 * Activity Event Created event
 * Occurs when a user's activity is recorded (score achieved, game played, etc).
 */
export class ActivityEventCreatedEvent extends DomainEvent {
  constructor(
    readonly actorUserId: string,
    readonly eventType: string,
    readonly payload: Record<string, any>,
    readonly visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE',
    params: {
      eventId: string;
      correlationId: string;
      idempotencyKey: string;
      timestamp?: Date;
    },
  ) {
    super({
      ...params,
      aggregateId: actorUserId,
      aggregateType: 'ActivityEvent',
    });
  }

  getEventType(): string {
    return 'ActivityEventCreated';
  }
}
