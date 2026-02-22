/**
 * Domain exceptions for the Friend System
 */

export class DomainException extends Error {
  constructor(
    message: string,
    readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FriendRequestAlreadyExistsException extends DomainException {
  constructor(fromUserId: string, toUserId: string) {
    super(
      `Friend request already exists from ${fromUserId} to ${toUserId}`,
      'FRIEND_REQUEST_ALREADY_EXISTS',
    );
  }
}

export class FriendRequestExpiredException extends DomainException {
  constructor(requestId: string) {
    super(`Friend request ${requestId} has expired`, 'FRIEND_REQUEST_EXPIRED');
  }
}

export class FriendRequestNotFoundException extends DomainException {
  constructor(requestId: string) {
    super(
      `Friend request ${requestId} not found`,
      'FRIEND_REQUEST_NOT_FOUND',
    );
  }
}

export class FriendshipAlreadyExistsException extends DomainException {
  constructor(userId: string, friendId: string) {
    super(
      `Friendship already exists between ${userId} and ${friendId}`,
      'FRIENDSHIP_ALREADY_EXISTS',
    );
  }
}

export class FriendshipNotFoundException extends DomainException {
  constructor(userId: string, friendId: string) {
    super(
      `Friendship not found between ${userId} and ${friendId}`,
      'FRIENDSHIP_NOT_FOUND',
    );
  }
}

export class UserNotFoundExit extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} not found`, 'USER_NOT_FOUND');
  }
}

export class UserBlockedException extends DomainException {
  constructor(userId: string, blockedUserId: string) {
    super(
      `User ${blockedUserId} has blocked ${userId}`,
      'USER_BLOCKED',
    );
  }
}

export class SelfFriendRequestException extends DomainException {
  constructor(userId: string) {
    super(
      `User ${userId} cannot send friend request to themselves`,
      'SELF_FRIEND_REQUEST',
    );
  }
}

export class InvalidFriendRequestStateException extends DomainException {
  constructor(state: string) {
    super(
      `Invalid friend request state: ${state}`,
      'INVALID_FRIEND_REQUEST_STATE',
    );
  }
}

export class PrivacySettingsNotFoundExit extends DomainException {
  constructor(userId: string) {
    super(
      `Privacy settings not found for user ${userId}`,
      'PRIVACY_SETTINGS_NOT_FOUND',
    );
  }
}

export class ActivityEventNotFoundExit extends DomainException {
  constructor(eventId: string) {
    super(`Activity event ${eventId} not found`, 'ACTIVITY_EVENT_NOT_FOUND');
  }
}

export class UnauthorizedAccessException extends DomainException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
  }
}

export class RateLimitExceededException extends DomainException {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED');
  }
}
