import { Injectable, Logger } from '@nestjs/common';
import { EventPublisher } from '@quest/shared-communication';

export interface UserCreatedPayload {
  userId: string;
  email: string;
  username: string;
  timestamp: Date;
}

export interface AchievementUnlockedPayload {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  timestamp: Date;
}

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(private readonly eventPublisher: EventPublisher) {}

  /**
   * Publish user created event
   */
  async publishUserCreated(payload: UserCreatedPayload): Promise<void> {
    this.logger.log(`Publishing user.created event for user: ${payload.userId}`);
    
    await this.eventPublisher.publish('user.created', payload, {
      persistent: true,
      priority: 5,
    });
  }

  /**
   * Publish achievement unlocked event
   */
  async publishAchievementUnlocked(
    payload: AchievementUnlockedPayload,
  ): Promise<void> {
    this.logger.log(
      `Publishing achievement.unlocked event for user: ${payload.userId}`,
    );
    
    await this.eventPublisher.publish('achievement.unlocked', payload, {
      persistent: true,
      priority: 3,
    });
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(): Promise<void> {
    this.logger.log('Publishing batch of events');
    
    const events = [
      {
        eventType: 'user.created',
        payload: {
          userId: 'user-1',
          email: 'user1@example.com',
          username: 'user1',
          timestamp: new Date(),
        },
      },
      {
        eventType: 'user.created',
        payload: {
          userId: 'user-2',
          email: 'user2@example.com',
          username: 'user2',
          timestamp: new Date(),
        },
      },
    ];

    await this.eventPublisher.publishBatch(events);
  }
}
