import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/constants';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { ActiveUser } from '../../auth/decorators/active-user.decorator';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminNotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly auditLogService: AdminAuditLogService,
  ) {}

  @Post('broadcast')
  async broadcast(
    @Body()
    body: {
      userIds: string[];
      type: any;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    },
    @ActiveUser() admin: { id: string },
  ) {
    const notifications = [];
    for (const userId of [...new Set(body.userIds || [])]) {
      const notification = await this.notificationsService.create({
        userId,
        type: body.type,
        title: body.title,
        message: body.message,
        data: body.data,
      });
      if (notification) notifications.push(notification);
    }

    await this.auditLogService.log({
      adminId: admin.id,
      action: 'BROADCAST_NOTIFICATION',
      targetType: 'USER_BATCH',
      details: { requested: body.userIds?.length || 0, delivered: notifications.length },
    });

    return { requested: body.userIds?.length || 0, created: notifications.length };
  }
}
