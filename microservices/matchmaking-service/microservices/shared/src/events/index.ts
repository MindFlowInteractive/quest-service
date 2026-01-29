import { IEvent } from '../interfaces';

export class BaseEvent implements IEvent {
  public readonly id: string;
  public readonly timestamp: Date;
  public readonly eventType: string;
  public readonly version: string;
  public readonly source: string;
  public readonly data: Record<string, any>;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(eventType: string, data: Record<string, any>, source: string, options?: {
    version?: string;
    correlationId?: string;
    causationId?: string;
  }) {
    this.id = this.generateId();
    this.timestamp = new Date();
    this.eventType = eventType;
    this.version = options?.version || '1.0.0';
    this.source = source;
    this.data = data;
    this.correlationId = options?.correlationId;
    this.causationId = options?.causationId;
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      eventType: this.eventType,
      version: this.version,
      source: this.source,
      data: this.data,
      correlationId: this.correlationId,
      causationId: this.causationId,
    };
  }

  static fromJSON(json: Record<string, any>): BaseEvent {
    const event = Object.create(BaseEvent.prototype);
    return Object.assign(event, {
      ...json,
      timestamp: new Date(json.timestamp),
    });
  }
}

export class UserRegisteredEvent extends BaseEvent {
  constructor(userId: string, email: string, username: string, source: string, options?: any) {
    super('UserRegistered', { userId, email, username }, source, options);
  }
}

export class UserUpdatedEvent extends BaseEvent {
  constructor(userId: string, changes: Record<string, any>, source: string, options?: any) {
    super('UserUpdated', { userId, changes }, source, options);
  }
}

export class PuzzleCompletedEvent extends BaseEvent {
  constructor(userId: string, puzzleId: string, score: number, completionTime: number, source: string, options?: any) {
    super('PuzzleCompleted', { userId, puzzleId, score, completionTime }, source, options);
  }
}

export class AchievementUnlockedEvent extends BaseEvent {
  constructor(userId: string, achievementId: string, achievementName: string, source: string, options?: any) {
    super('AchievementUnlocked', { userId, achievementId, achievementName }, source, options);
  }
}

export class FriendRequestSentEvent extends BaseEvent {
  constructor(fromUserId: string, toUserId: string, source: string, options?: any) {
    super('FriendRequestSent', { fromUserId, toUserId }, source, options);
  }
}

export class FriendRequestAcceptedEvent extends BaseEvent {
  constructor(userId: string, friendId: string, source: string, options?: any) {
    super('FriendRequestAccepted', { userId, friendId }, source, options);
  }
}

export class NotificationCreatedEvent extends BaseEvent {
  constructor(userId: string, type: string, title: string, message: string, source: string, options?: any) {
    super('NotificationCreated', { userId, type, title, message }, source, options);
  }
}

export class TournamentStartedEvent extends BaseEvent {
  constructor(tournamentId: string, name: string, participantCount: number, source: string, options?: any) {
    super('TournamentStarted', { tournamentId, name, participantCount }, source, options);
  }
}

export class TournamentEndedEvent extends BaseEvent {
  constructor(tournamentId: string, winnerId: string, finalStandings: any[], source: string, options?: any) {
    super('TournamentEnded', { tournamentId, winnerId, finalStandings }, source, options);
  }
}
