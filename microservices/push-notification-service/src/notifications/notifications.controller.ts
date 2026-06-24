import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  SendPushNotificationDto,
  SchedulePushNotificationDto,
  BroadcastPushNotificationDto,
} from './dto/notification.dto';

@Controller('push-notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async send(@Body() dto: SendPushNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Post('schedule')
  async schedule(@Body() dto: SchedulePushNotificationDto) {
    return this.notificationsService.schedule(dto);
  }

  @Post('broadcast')
  async broadcast(@Body() dto: BroadcastPushNotificationDto) {
    return this.notificationsService.broadcast(dto);
  }

  @Put(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.notificationsService.cancel(id);
  }

  @Get('user/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    return this.notificationsService.getUserHistory(userId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.notificationsService.getById(id);
  }
}
