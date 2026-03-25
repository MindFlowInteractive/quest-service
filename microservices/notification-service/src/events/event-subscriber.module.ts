import { Module, OnModuleInit } from '@nestjs/common';
import { EventBusService, RabbitMQService } from '@quest-service/shared';
import {
  UserRegisteredHandler,
  PuzzleCompletedHandler,
  AchievementUnlockedHandler,
  FriendRequestSentHandler,
  FriendRequestAcceptedHandler,
  DailyChallengeAvailableHandler,
  TournamentStartingSoonHandler,
  SessionInviteReceivedHandler,
} from '../event-handlers';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [
    RabbitMQService,
    EventBusService,
    UserRegisteredHandler,
    PuzzleCompletedHandler,
    AchievementUnlockedHandler,
    FriendRequestSentHandler,
    FriendRequestAcceptedHandler,
    DailyChallengeAvailableHandler,
    TournamentStartingSoonHandler,
    SessionInviteReceivedHandler,
  ],
  exports: [EventBusService],
})
export class EventSubscriberModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly userRegisteredHandler: UserRegisteredHandler,
    private readonly puzzleCompletedHandler: PuzzleCompletedHandler,
    private readonly achievementUnlockedHandler: AchievementUnlockedHandler,
    private readonly friendRequestSentHandler: FriendRequestSentHandler,
    private readonly friendRequestAcceptedHandler: FriendRequestAcceptedHandler,
    private readonly dailyChallengeHandler: DailyChallengeAvailableHandler,
    private readonly tournamentHandler: TournamentStartingSoonHandler,
    private readonly sessionInviteHandler: SessionInviteReceivedHandler,
  ) {}

  async onModuleInit() {
    // Register event handlers
    this.eventBus.registerHandler('UserRegistered', this.userRegisteredHandler);
    this.eventBus.registerHandler('PuzzleCompleted', this.puzzleCompletedHandler);
    this.eventBus.registerHandler('AchievementUnlocked', this.achievementUnlockedHandler);
    this.eventBus.registerHandler('FriendRequestSent', this.friendRequestSentHandler);
    this.eventBus.registerHandler('FriendRequestAccepted', this.friendRequestAcceptedHandler);
    this.eventBus.registerHandler('DailyChallengeAvailable', this.dailyChallengeHandler);
    this.eventBus.registerHandler('TournamentStartingSoon', this.tournamentHandler);
    this.eventBus.registerHandler('SessionInviteReceived', this.sessionInviteHandler);

    // Subscribe to message broker events
    await this.setupMessageBrokerSubscriptions();
  }

  private async setupMessageBrokerSubscriptions() {
    // Subscribe to events from other services
    // This would typically use RabbitMQ or Redis service to subscribe to events
    console.log('Setting up message broker subscriptions for notification service');
  }
}
