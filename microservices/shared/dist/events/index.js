"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentEndedEvent = exports.TournamentStartedEvent = exports.NotificationCreatedEvent = exports.FriendRequestAcceptedEvent = exports.FriendRequestSentEvent = exports.AchievementUnlockedEvent = exports.PuzzleCompletedEvent = exports.UserUpdatedEvent = exports.UserRegisteredEvent = exports.BaseEvent = void 0;
class BaseEvent {
    constructor(eventType, data, source, options) {
        this.id = this.generateId();
        this.timestamp = new Date();
        this.eventType = eventType;
        this.version = options?.version || '1.0.0';
        this.source = source;
        this.data = data;
        this.correlationId = options?.correlationId;
        this.causationId = options?.causationId;
    }
    generateId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    toJSON() {
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
    static fromJSON(json) {
        const event = Object.create(BaseEvent.prototype);
        return Object.assign(event, {
            ...json,
            timestamp: new Date(json.timestamp),
        });
    }
}
exports.BaseEvent = BaseEvent;
class UserRegisteredEvent extends BaseEvent {
    constructor(userId, email, username, source, options) {
        super('UserRegistered', { userId, email, username }, source, options);
    }
}
exports.UserRegisteredEvent = UserRegisteredEvent;
class UserUpdatedEvent extends BaseEvent {
    constructor(userId, changes, source, options) {
        super('UserUpdated', { userId, changes }, source, options);
    }
}
exports.UserUpdatedEvent = UserUpdatedEvent;
class PuzzleCompletedEvent extends BaseEvent {
    constructor(userId, puzzleId, score, completionTime, source, options) {
        super('PuzzleCompleted', { userId, puzzleId, score, completionTime }, source, options);
    }
}
exports.PuzzleCompletedEvent = PuzzleCompletedEvent;
class AchievementUnlockedEvent extends BaseEvent {
    constructor(userId, achievementId, achievementName, source, options) {
        super('AchievementUnlocked', { userId, achievementId, achievementName }, source, options);
    }
}
exports.AchievementUnlockedEvent = AchievementUnlockedEvent;
class FriendRequestSentEvent extends BaseEvent {
    constructor(fromUserId, toUserId, source, options) {
        super('FriendRequestSent', { fromUserId, toUserId }, source, options);
    }
}
exports.FriendRequestSentEvent = FriendRequestSentEvent;
class FriendRequestAcceptedEvent extends BaseEvent {
    constructor(userId, friendId, source, options) {
        super('FriendRequestAccepted', { userId, friendId }, source, options);
    }
}
exports.FriendRequestAcceptedEvent = FriendRequestAcceptedEvent;
class NotificationCreatedEvent extends BaseEvent {
    constructor(userId, type, title, message, source, options) {
        super('NotificationCreated', { userId, type, title, message }, source, options);
    }
}
exports.NotificationCreatedEvent = NotificationCreatedEvent;
class TournamentStartedEvent extends BaseEvent {
    constructor(tournamentId, name, participantCount, source, options) {
        super('TournamentStarted', { tournamentId, name, participantCount }, source, options);
    }
}
exports.TournamentStartedEvent = TournamentStartedEvent;
class TournamentEndedEvent extends BaseEvent {
    constructor(tournamentId, winnerId, finalStandings, source, options) {
        super('TournamentEnded', { tournamentId, winnerId, finalStandings }, source, options);
    }
}
exports.TournamentEndedEvent = TournamentEndedEvent;
//# sourceMappingURL=index.js.map