import { Controller, Post, Body, Param, Delete, Get } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';

@Controller('devices')
export class DevicesController {
  constructor(@InjectRepository(Device) private readonly repo: Repository<Device>) {}

  @Post(':userId/register')
  async register(@Param('userId') userId: string, @Body() body: { token: string; platform?: string; meta?: any }) {
    let device = await this.repo.findOne({ where: { token: body.token } });
    if (!device) {
      device = this.repo.create({ userId, token: body.token, platform: body.platform, meta: body.meta ?? {} });
    } else {
      device.userId = userId;
      device.platform = body.platform ?? device.platform;
      device.meta = { ...(device.meta ?? {}), ...(body.meta ?? {}) };
    }
    await this.repo.save(device);
    return { ok: true, device };
  }

  @Delete(':userId/:token')
  async deregister(@Param('userId') userId: string, @Param('token') token: string) {
    await this.repo.delete({ token, userId } as any);
    return { ok: true };
  }

  @Get(':userId')
  async list(@Param('userId') userId: string) {
    const devices = await this.repo.find({ where: { userId } });
    return { ok: true, devices };
  }
}
