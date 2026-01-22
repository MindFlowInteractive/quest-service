import { Module, OnModuleInit } from '@nestjs/common';
import { EventBusService, RabbitMQService } from '@quest-service/shared';
import { 
  UserRegisteredHandler,
  PuzzleCompletedHandler,
  TournamentStartedHandler,
  TournamentEndedHandler,
} from '../event-handlers';

@Module({
  providers: [
    RabbitMQService,
    EventBusService,
    UserRegisteredHandler,
    PuzzleCompletedHandler,
    TournamentStartedHandler,
    TournamentEndedHandler,
  ],
  exports: [EventBusService],
})
export class EventSubscriberModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly userRegisteredHandler: UserRegisteredHandler,
    private readonly puzzleCompletedHandler: PuzzleCompletedHandler,
    private readonly tournamentStartedHandler: TournamentStartedHandler,
    private readonly tournamentEndedHandler: TournamentEndedHandler,
  ) {}

  async onModuleInit() {
    // Register event handlers
    this.eventBus.registerHandler('UserRegistered', this.userRegisteredHandler);
    this.eventBus.registerHandler('PuzzleCompleted', this.puzzleCompletedHandler);
    this.eventBus.registerHandler('TournamentStarted', this.tournamentStartedHandler);
    this.eventBus.registerHandler('TournamentEnded', this.tournamentEndedHandler);

    // Subscribe to message broker events
    await this.setupMessageBrokerSubscriptions();
  }

  private async setupMessageBrokerSubscriptions() {
    // Subscribe to events from other services
    // This would typically use RabbitMQ or Redis service to subscribe to events
    console.log('Setting up message broker subscriptions for social service');
  }
}
