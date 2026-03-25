import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ActiveUser } from '../auth/decorators/active-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { AwardXpDto } from './dto/award-xp.dto';
import { XpService } from './xp.service';

@Controller()
export class XpController {
  constructor(private readonly xpService: XpService) {}

  @Get('players/me/level')
  @UseGuards(JwtAuthGuard)
  async getMyLevel(@ActiveUser() user: { userId?: string; id?: string }) {
    const userId = user?.userId ?? user?.id;
    return this.xpService.getMyLevel(userId);
  }

  @Get('players/:id/level')
  async getPublicLevel(@Param('id') userId: string) {
    return this.xpService.getPublicLevel(userId);
  }

  @Post('xp/award')
  @UseGuards(ApiKeyGuard)
  async awardXp(@Body() dto: AwardXpDto) {
    return this.xpService.awardXp(dto);
  }
}
