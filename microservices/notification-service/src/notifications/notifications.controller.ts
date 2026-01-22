import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('send')
    async send(
        @Body() body: { userId: string; type: string; data: any },
    ) {
        return this.notificationsService.send(body.userId, body.type, body.data);
    }

    @Get(':userId')
    async getUserNotifications(@Param('userId') userId: string) {
        return this.notificationsService.getUserNotifications(userId);
    }

    @Put(':id/read')
    async markAsRead(@Param('id') id: string) {
        await this.notificationsService.markAsRead(id);
        return { success: true };
    }
}
