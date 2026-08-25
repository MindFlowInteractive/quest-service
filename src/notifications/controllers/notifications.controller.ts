import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';

import { NotificationsService } from '../services/notifications.service';
import { NotificationPreferencesService } from '../services/notification-preferences.service';
import { NotificationQueryDto } from '../dto/notification-query.dto';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';

/**
 * Adapt req.user access to the authentication conventions already used
 * by quest-service.
 */
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  history(@Req() req: any, @Query() query: NotificationQueryDto) {
    const userId = this.getUserId(req);

    return this.notificationsService.history(userId, query.page, query.limit);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notificationsService.unreadCount(this.getUserId(req));
  }

  @Patch(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notificationsService.markRead(this.getUserId(req), id);
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.notificationsService.markAllRead(this.getUserId(req));
  }

  @Get('preferences')
  preferences(@Req() req: any) {
    return this.preferencesService.getOrCreate(this.getUserId(req));
  }

  @Patch('preferences')
  updatePreferences(
    @Req() req: any,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.update(this.getUserId(req), body);
  }

  private getUserId(req: any): string {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new Error(
        'Authenticated user ID is required. Apply the project auth guard.',
      );
    }

    return String(userId);
  }
}
