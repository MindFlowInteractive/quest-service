import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post(':userId/:deviceId')
  upsert(
    @Param('userId') userId: string,
    @Param('deviceId') deviceId: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.syncService.upsert(userId, deviceId, data);
  }

  @Get(':userId/:deviceId')
  getState(@Param('userId') userId: string, @Param('deviceId') deviceId: string) {
    return this.syncService.getState(userId, deviceId);
  }

  @Get(':userId/devices')
  getDevices(@Param('userId') userId: string) {
    return this.syncService.getDevices(userId);
  }
}