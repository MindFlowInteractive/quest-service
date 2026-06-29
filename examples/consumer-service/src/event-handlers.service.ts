import { Injectable, Logger } from '@nestjs/common';
import { EventHandler, BaseEvent } from '@quest/shared-communication';

interface UserCreatedPayload {
  userId: string;
  email: string;
  username: string;
  timestamp: Date;
}

interface AchievementUnlockedPayload {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  timestamp: Date;
}

@Injectable()
export class EventHandlersService {
  private readonly logger = new Logger(EventHandlersService.name);

  /**
   * Handle user.created events
   */
  @EventHandler({
    eventType: 'user.created',
    queue: 'consumer-service.user-created',
    prefetchCount: 5,
    retryAttempts: 3,
  })
  async handleUserCreated(event: BaseEvent<UserCreatedPayload>): Promise<void> {
    this.logger.log(
      `Processing user.created event [TraceID: ${event.metadata.traceId}]`,
    );
    
    const { userId, email, username } = event.payload;
    
    // Simulate processing
    this.logger.log(`New user created: ${username} (${email}) - ID: ${userId}`);
    
    // Simulate some work
    await this.simulateWork(100);
    
    this.logger.log(`Finished processing user.created for user: ${userId}`);
  }

  /**
   * Handle achievement.unlocked events
   */
  @EventHandler({
    eventType: 'achievement.unlocked',
    queue: 'consumer-service.achievement-unlocked',
    prefetchCount: 10,
    retryAttempts: 3,
  })
  async handleAchievementUnlocked(
    event: BaseEvent<AchievementUnlockedPayload>,
  ): Promise<void> {
    this.logger.log(
      `Processing achievement.unlocked event [TraceID: ${event.metadata.traceId}]`,
    );
    
    const { userId, achievementName, points } = event.payload;
    
    // Simulate processing
    this.logger.log(
      `User ${userId} unlocked achievement: ${achievementName} (+${points} points)`,
    );
    
    // Simulate some work
    await this.simulateWork(50);
    
    this.logger.log(
      `Finished processing achievement.unlocked for user: ${userId}`,
    );
  }

  /**
   * Example handler that fails to test DLQ
   */
  @EventHandler({
    eventType: 'test.failure',
    queue: 'consumer-service.test-failure',
    prefetchCount: 1,
    retryAttempts: 2,
  })
  async handleTestFailure(event: BaseEvent<any>): Promise<void> {
    this.logger.log(
      `Processing test.failure event [TraceID: ${event.metadata.traceId}]`,
    );
    
    // Intentionally throw error to test DLQ
    throw new Error('Simulated failure for DLQ testing');
  }

  /**
   * Simulate async work
   */
  private simulateWork(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
