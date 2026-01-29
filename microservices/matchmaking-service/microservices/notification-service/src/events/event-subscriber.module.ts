import { Module, OnModuleInit } from '@nestjs/common';
import { EventBusService, RabbitMQService } from '@quest-service/shared';
import { 
  UserRegisteredHandler,
  PuzzleCompletedHandler,
  AchievementUnlockedHandler,
  FriendRequestSentHandler,
  FriendRequestAcceptedHandler,
} from '../event-handlers';

@Module({
  providers: [
    RabbitMQService,
    EventBusService,
    UserRegisteredHandler,
    PuzzleCompletedHandler,
    AchievementUnlockedHandler,
    FriendRequestSentHandler,
    FriendRequestAcceptedHandler,
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
  ) {}

  async onModuleInit() {
    // Register event handlers
    this.eventBus.registerHandler('UserRegistered', this.userRegisteredHandler);
    this.eventBus.registerHandler('PuzzleCompleted', this.puzzleCompletedHandler);
    this.eventBus.registerHandler('AchievementUnlocked', this.achievementUnlockedHandler);
    this.eventBus.registerHandler('FriendRequestSent', this.friendRequestSentHandler);
    this.eventBus.registerHandler('FriendRequestAccepted', this.friendRequestAcceptedHandler);

    // Subscribe to message broker events
    await this.setupMessageBrokerSubscriptions();
  }

  private async setupMessageBrokerSubscriptions() {
    // Subscribe to events from other services
    // This would typically use RabbitMQ or Redis service to subscribe to events
    console.log('Setting up message broker subscriptions for notification service');
  }
}
