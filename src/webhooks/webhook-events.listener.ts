import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksService } from './webhooks.service';
import { WEBHOOK_INTERNAL_EVENTS } from './webhook.constants';

@Injectable()
export class WebhookEventsListener {
  constructor(private readonly webhooksService: WebhooksService) {}

  @OnEvent(WEBHOOK_INTERNAL_EVENTS.puzzleSolved, { async: true })
  async handlePuzzleSolved(payload: Record<string, unknown>) {
    await this.webhooksService.enqueueEvent('puzzle.solved', payload);
  }

  @OnEvent(WEBHOOK_INTERNAL_EVENTS.achievementUnlocked, { async: true })
  async handleAchievementUnlocked(payload: Record<string, unknown>) {
    await this.webhooksService.enqueueEvent('achievement.unlocked', payload);
  }

  @OnEvent(WEBHOOK_INTERNAL_EVENTS.sessionEnded, { async: true })
  async handleSessionEnded(payload: Record<string, unknown>) {
    await this.webhooksService.enqueueEvent('session.ended', payload);
  }

  @OnEvent(WEBHOOK_INTERNAL_EVENTS.userRegistered, { async: true })
  async handleUserRegistered(payload: Record<string, unknown>) {
    await this.webhooksService.enqueueEvent('user.registered', payload);
  }

  @OnEvent(WEBHOOK_INTERNAL_EVENTS.leaderboardUpdated, { async: true })
  async handleLeaderboardUpdated(payload: Record<string, unknown>) {
    await this.webhooksService.enqueueEvent('leaderboard.updated', payload);
  }
}