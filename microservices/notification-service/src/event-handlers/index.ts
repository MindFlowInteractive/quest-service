import { Injectable } from '@nestjs/common';
import { IEventHandler, BaseEvent, UserRegisteredEvent, PuzzleCompletedEvent, AchievementUnlockedEvent, FriendRequestSentEvent, FriendRequestAcceptedEvent } from '@quest-service/shared';

@Injectable()
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent): Promise<void> {
    console.log('Handling UserRegistered event:', event);
    // Send welcome notification
    await this.sendWelcomeNotification(event.data.userId, event.data.email);
  }

  private async sendWelcomeNotification(userId: string, email: string): Promise<void> {
    // Implementation would send welcome email/push notification
    console.log(`Welcome notification sent to user ${userId} at ${email}`);
  }
}

@Injectable()
export class PuzzleCompletedHandler implements IEventHandler<PuzzleCompletedEvent> {
  async handle(event: PuzzleCompletedEvent): Promise<void> {
    console.log('Handling PuzzleCompleted event:', event);
    // Send puzzle completion notification
    await this.sendPuzzleCompletionNotification(event.data.userId, event.data.score);
  }

  private async sendPuzzleCompletionNotification(userId: string, score: number): Promise<void> {
    console.log(`Puzzle completion notification sent to user ${userId} with score ${score}`);
  }
}

@Injectable()
export class AchievementUnlockedHandler implements IEventHandler<AchievementUnlockedEvent> {
  async handle(event: AchievementUnlockedEvent): Promise<void> {
    console.log('Handling AchievementUnlocked event:', event);
    // Send achievement notification
    await this.sendAchievementNotification(event.data.userId, event.data.achievementName);
  }

  private async sendAchievementNotification(userId: string, achievementName: string): Promise<void> {
    console.log(`Achievement notification sent to user ${userId}: ${achievementName}`);
  }
}

@Injectable()
export class FriendRequestSentHandler implements IEventHandler<FriendRequestSentEvent> {
  async handle(event: FriendRequestSentEvent): Promise<void> {
    console.log('Handling FriendRequestSent event:', event);
    // Send friend request notification
    await this.sendFriendRequestNotification(event.data.toUserId, event.data.fromUserId);
  }

  private async sendFriendRequestNotification(toUserId: string, fromUserId: string): Promise<void> {
    console.log(`Friend request notification sent to user ${toUserId} from user ${fromUserId}`);
  }
}

@Injectable()
export class FriendRequestAcceptedHandler implements IEventHandler<FriendRequestAcceptedEvent> {
  async handle(event: FriendRequestAcceptedEvent): Promise<void> {
    console.log('Handling FriendRequestAccepted event:', event);
    // Send friend request accepted notification
    await this.sendFriendAcceptedNotification(event.data.userId, event.data.friendId);
  }

  private async sendFriendAcceptedNotification(userId: string, friendId: string): Promise<void> {
    console.log(`Friend accepted notification sent to user ${userId} and ${friendId}`);
  }
}
