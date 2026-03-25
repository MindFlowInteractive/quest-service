import { Injectable } from '@nestjs/common';
import { IEventHandler, BaseEvent } from '@quest-service/shared';
import { NotificationsService } from '../notifications/notifications.service';

function extractPushData(event: BaseEvent) {
  const { tokens, title, body, data, userId } = event.data;
  return { tokens: tokens as string[] | undefined, title: title as string, body: body as string, data, userId };
}

@Injectable()
export class UserRegisteredHandler implements IEventHandler<BaseEvent> {
  async handle(event: BaseEvent): Promise<void> {
    console.log('Handling UserRegistered event:', event.eventType);
  }
}

@Injectable()
export class PuzzleCompletedHandler implements IEventHandler<BaseEvent> {
  async handle(event: BaseEvent): Promise<void> {
    console.log('Handling PuzzleCompleted event:', event.eventType);
  }
}

@Injectable()
export class AchievementUnlockedHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'achievement');
  }
}

@Injectable()
export class FriendRequestSentHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'friendRequest');
  }
}

@Injectable()
export class FriendRequestAcceptedHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'friendRequest');
  }
}

@Injectable()
export class DailyChallengeAvailableHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'broadcast');
  }
}

@Injectable()
export class TournamentStartingSoonHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'tournamentReminder');
  }
}

@Injectable()
export class SessionInviteReceivedHandler implements IEventHandler<BaseEvent> {
  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: BaseEvent): Promise<void> {
    const { tokens, title, body, data } = extractPushData(event);
    if (!tokens?.length) return;
    await this.notificationsService.enqueuePush(tokens, { title, body, data }, 'sessionInvite');
  }
}
