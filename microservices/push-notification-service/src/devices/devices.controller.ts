import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { RegisterDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  async register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.register(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }

  @Delete(':id')
  async deactivate(@Param('id') id: string) {
    await this.devicesService.deactivate(id);
    return { success: true };
  }

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string) {
    return this.devicesService.getByUser(userId);
  }
}
