import { Controller, Post, Body, Param, Delete, Get, UseGuards, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@Controller('notifications/device-tokens')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(@InjectRepository(Device) private readonly repo: Repository<Device>) {}

  @Post()
  async register(@ActiveUser() user: any, @Body() body: RegisterDeviceDto) {
    const userId = user.userId;

    let device = await this.repo.findOne({ where: { token: body.token } });
    if (device) {
      device.userId = userId;
      device.platform = body.platform;
    } else {
      const count = await this.repo.count({ where: { userId } });
      if (count >= 10) {
        throw new BadRequestException('Maximum of 10 device tokens per user');
      }
      device = this.repo.create({ userId, token: body.token, platform: body.platform });
    }

    await this.repo.save(device);
    return { ok: true, device };
  }

  @Delete(':token')
  async deregister(@ActiveUser() user: any, @Param('token') token: string) {
    await this.repo.delete({ token, userId: user.userId });
    return { ok: true };
  }

  @Get()
  async list(@ActiveUser() user: any) {
    const devices = await this.repo.find({ where: { userId: user.userId } });
    return { ok: true, devices };
  }
}
