import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SlotService } from './slot.service';
import { SpinDto } from './dto/spin.dto';

@Controller('slot')
export class SlotController {
  constructor(private readonly slotService: SlotService) {}

  @Get('seed-hash')
  getSeedHash() {
    return { seedHash: this.slotService.getSeedHash() };
  }

  @Get('reveal-seed')
  reveal() {
    return { seed: this.slotService.revealSeed() };
  }

  @Post('spin')
  spin(@Body() body: SpinDto) {
    return this.slotService.spin(body);
  }

  @Get('history/:userId')
  history(@Param('userId') userId: string) {
    return this.slotService.getHistoryForUser(userId);
  }
}
