import { IEvent } from '../interfaces';
export declare class BaseEvent implements IEvent {
    readonly id: string;
    readonly timestamp: Date;
    readonly eventType: string;
    readonly version: string;
    readonly source: string;
    readonly data: Record<string, any>;
    readonly correlationId?: string;
    readonly causationId?: string;
    constructor(eventType: string, data: Record<string, any>, source: string, options?: {
        version?: string;
        correlationId?: string;
        causationId?: string;
    });
    private generateId;
    toJSON(): Record<string, any>;
    static fromJSON(json: Record<string, any>): BaseEvent;
}
export declare class UserRegisteredEvent extends BaseEvent {
    constructor(userId: string, email: string, username: string, source: string, options?: any);
}
export declare class UserUpdatedEvent extends BaseEvent {
    constructor(userId: string, changes: Record<string, any>, source: string, options?: any);
}
export declare class PuzzleCompletedEvent extends BaseEvent {
    constructor(userId: string, puzzleId: string, score: number, completionTime: number, source: string, options?: any);
}
export declare class AchievementUnlockedEvent extends BaseEvent {
    constructor(userId: string, achievementId: string, achievementName: string, source: string, options?: any);
}
export declare class FriendRequestSentEvent extends BaseEvent {
    constructor(fromUserId: string, toUserId: string, source: string, options?: any);
}
export declare class FriendRequestAcceptedEvent extends BaseEvent {
    constructor(userId: string, friendId: string, source: string, options?: any);
}
export declare class NotificationCreatedEvent extends BaseEvent {
    constructor(userId: string, type: string, title: string, message: string, source: string, options?: any);
}
export declare class TournamentStartedEvent extends BaseEvent {
    constructor(tournamentId: string, name: string, participantCount: number, source: string, options?: any);
}
export declare class TournamentEndedEvent extends BaseEvent {
    constructor(tournamentId: string, winnerId: string, finalStandings: any[], source: string, options?: any);
}
