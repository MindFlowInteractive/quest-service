import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferenceDto } from './dto/preference.dto';
import { NotificationFeedbackDto } from './dto/feedback.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationService) {}

  @Post('create')
  async create(@Body() body: CreateNotificationDto) {
    await this.service.createNotificationForUsers({
      userIds: body.userIds,
      segment: body.segment,
      type: body.type,
      title: body.title,
      body: body.body,
      meta: body.meta,
      sendAt: body.sendAt ? new Date(body.sendAt) : undefined,
      variantId: body.variantId,
    });
    return { ok: true };
  }

  @Post(':userId/preferences')
  async setPreferences(@Param('userId') userId: string, @Body() prefs: NotificationPreferenceDto) {
    const updated = await this.service.setPreferences(userId, { notifications: prefs });
    return { ok: true, preferences: updated?.preferences };
  }

  @Get(':userId/preferences')
  async getPreferences(@Param('userId') userId: string) {
    const prefs = await this.service.getPreferences(userId);
    return { ok: true, preferences: prefs };
  }

  @Post(':notificationId/feedback')
  async feedback(@Param('notificationId') notificationId: string, @Body() body: NotificationFeedbackDto) {
    const res = await this.service.recordFeedback(notificationId, (body as any).userId ?? 'unknown', { action: body.action, comment: body.comment });
    return { ok: !!res };
  }
}
