import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Notification } from './entities/notification.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from './email.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Device } from './entities/device.entity';
// import { PushService } from './push.service';
import { PLAYER_LEVEL_UP_EVENT } from '../xp/xp.constants';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  private readonly EVENT_PATTERNS: Record<string, string> = {
    achievements: 'AchievementUnlocked',
    dailyChallenge: 'DailyChallengeAvailable',
    friendRequest: 'FriendRequestSent',
    tournamentReminder: 'TournamentStartingSoon',
    sessionInvite: 'SessionInviteReceived',
  };

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    private readonly emailService: EmailService,
    @Inject(SchedulerRegistry) private readonly scheduler: any,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) { }

  // Backwards-compatible convenience method used across the codebase
  async notifyAchievementUnlocked(userId: string, achievement: { name: string; description: string; iconUrl?: string; celebrationMessage?: string }) {
    this.logger.log(`User ${userId} unlocked achievement: ${achievement.name}`);

    // Create in-app notification
    const notif = this.notificationRepo.create({
      userId,
      type: 'achievement',
      title: `Achievement unlocked: ${achievement.name}`,
      body: achievement.description,
      meta: { iconUrl: achievement.iconUrl, celebrationMessage: achievement.celebrationMessage },
    });
    await this.notificationRepo.save(notif);

    // Send immediate channels based on user preferences
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;

    const prefs = user.preferences?.notifications ?? { email: false, push: false };
    if (prefs.email) {
      try {
        await this.emailService.sendEmail(user.email, `You unlocked ${achievement.name}`, achievement.description);
        await this.recordDelivery(notif.id, 'email', 'sent');
      } catch (err) {
        this.logger.error('Email send failed', err as any);
        await this.recordDelivery(notif.id, 'email', 'failed', String(err));
      }
    }

    // Push notification via microservice
    await this.emitPushEvent(userId, 'achievements', {
      title: notif.title,
      body: notif.body ?? '',
      data: { type: 'achievement', ...notif.meta },
    });
    await this.recordDelivery(notif.id, 'push', 'queued');

    // For in-app, mark delivered
    await this.recordDelivery(notif.id, 'in_app', 'delivered');

    return true;
  }

  async createNotificationForUsers(opts: {
    userIds?: string[];
    segment?: { key: string; value: any };
    type: string;
    title: string;
    body?: string;
    meta?: any;
    sendAt?: Date;
    variantId?: string; // A/B testing
  }) {
    const targets: string[] = [];
    if (opts.userIds?.length) targets.push(...opts.userIds);
    if (opts.segment) {
      // simple segment targeting: query users where metadata[segment.key] = segment.value
      const users = await this.userRepo.find({ where: {} });
      // naive in-memory filter to avoid adding complex query builder code here
      for (const u of users) {
        const val = (u.metadata as any)?.[opts.segment.key];
        if (val === opts.segment.value) targets.push(u.id);
      }
    }

    for (const userId of [...new Set(targets)]) {
      const notif = this.notificationRepo.create({
        userId,
        type: opts.type,
        title: opts.title,
        body: opts.body,
        meta: opts.meta ?? {},
        variantId: opts.variantId,
      });

      await this.notificationRepo.save(notif);

      if (opts.sendAt && opts.sendAt > new Date()) {
        // schedule
        const jobName = `notification-send-${notif.id}`;
        // schedule as a timeout
        const timeout = setTimeout(async () => {
          await this.dispatchNotification(notif.id);
          this.scheduler.deleteTimeout(jobName);
        }, opts.sendAt.getTime() - Date.now());
        this.scheduler.addTimeout(jobName, timeout as any);
        await this.recordDelivery(notif.id, 'scheduler', 'scheduled');
      } else {
        // immediate dispatch
        await this.dispatchNotification(notif.id);
      }
    }
  }

  private async dispatchNotification(notificationId: string) {
    const notif = await this.notificationRepo.findOne({ where: { id: notificationId } });
    if (!notif) return;
    const user = await this.userRepo.findOne({ where: { id: notif.userId } });
    if (!user) return;

    const prefs = user.preferences?.notifications ?? { email: false, push: false };

    // deliver in-app
    await this.recordDelivery(notif.id, 'in_app', 'delivered');

    if (prefs.email) {
      try {
        await this.emailService.sendEmail(user.email, notif.title, notif.body ?? '');
        await this.recordDelivery(notif.id, 'email', 'sent');
      } catch (err) {
        this.logger.error('Email send failed', err as any);
        await this.recordDelivery(notif.id, 'email', 'failed', String(err));
      }
    }

    if (prefs.push) {
      await this.emitPushEvent(notif.userId, notif.type, {
        title: notif.title, body: notif.body ?? '',
      });
      await this.recordDelivery(notif.id, 'push', 'queued');
    }
  }

  async emitPushEvent(userId: string, eventType: string, payload: { title: string; body: string; data?: Record<string, any> }) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    const prefs = user.preferences?.notifications ?? {};
    if (prefs.push !== true) return;
    if ((prefs as any)[eventType] === false) return;
    const devices = await this.deviceRepo.find({ where: { userId } });
    if (!devices?.length) return;
    const tokens = devices.map((d) => d.token);
    const pattern = this.EVENT_PATTERNS[eventType] || eventType;
    this.notificationClient.emit(pattern, {
      userId, tokens,
      title: payload.title, body: payload.body,
      data: payload.data ?? {},
    }).subscribe();
    this.logger.log(`Push event ${pattern} emitted for user ${userId} to ${tokens.length} devices`);
  }

  async emitBroadcastPush(eventType: string, payload: { title: string; body: string; data?: Record<string, any> }) {
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const users = await this.userRepo
        .createQueryBuilder('user')
        .select(['user.id'])
        .where("user.preferences->'notifications'->>'push' = 'true'")
        .andWhere(`COALESCE(user.preferences->'notifications'->>:eventType, 'true') != 'false'`, { eventType })
        .skip(offset).take(PAGE_SIZE).getMany();
      if (users.length === 0) { hasMore = false; break; }
      const userIds = users.map((u) => u.id);
      const devices = await this.deviceRepo
        .createQueryBuilder('device')
        .select(['device.token'])
        .where('device.userId IN (:...userIds)', { userIds })
        .getMany();
      const tokens = devices.map((d) => d.token);
      if (tokens.length > 0) {
        const pattern = this.EVENT_PATTERNS[eventType] || eventType;
        this.notificationClient.emit(pattern, {
          type: 'broadcast', tokens,
          title: payload.title, body: payload.body,
          data: payload.data ?? {},
        }).subscribe();
        this.logger.log(`Broadcast ${pattern} emitted: ${tokens.length} tokens (batch offset=${offset})`);
      }
      offset += PAGE_SIZE;
      hasMore = users.length === PAGE_SIZE;
    }
  }

  private async recordDelivery(notificationId: string, channel: string, status: string, details?: string) {
    const d = this.deliveryRepo.create({ notificationId, channel, status, details });
    await this.deliveryRepo.save(d);
  }

  async setPreferences(userId: string, preferencesPatch: any) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;
    user.preferences = { ...(user.preferences ?? {}), ...preferencesPatch };
    return this.userRepo.save(user);
  }

  async getPreferences(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return user?.preferences ?? null;
  }

  async recordFeedback(notificationId: string, userId: string, feedback: { action: string; comment?: string }) {
    const notif = await this.notificationRepo.findOne({ where: { id: notificationId } });
    if (!notif) return null;
    // Append feedback into meta.feedback array
    notif.meta = notif.meta ?? {};
    notif.meta.feedback = notif.meta.feedback ?? [];
    notif.meta.feedback.push({ userId, action: feedback.action, comment: feedback.comment, at: new Date() });
    await this.notificationRepo.save(notif);
    await this.recordDelivery(notificationId, 'feedback', 'received', feedback.action);
    return notif;
  }

  @OnEvent(PLAYER_LEVEL_UP_EVENT)
  async handlePlayerLevelUp(payload: {
    userId: string;
    oldLevel: number;
    newLevel: number;
    totalXP: number;
  }) {
    const notif = this.notificationRepo.create({
      userId: payload.userId,
      type: 'level_up',
      title: `Level ${payload.newLevel} reached`,
      body: `You advanced from level ${payload.oldLevel} to level ${payload.newLevel}.`,
      meta: { totalXP: payload.totalXP },
    });

    await this.notificationRepo.save(notif);
    await this.recordDelivery(notif.id, 'in_app', 'delivered');
  }
}
