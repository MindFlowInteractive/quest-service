import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Controller()
export class RateLimitController {
  constructor(private readonly svc: RateLimitService) {}

  @Post('check')
  check(@Body() body: { userId: string; endpoint: string }) {
    return this.svc.check(body.userId, body.endpoint);
  }

  @Get('quota/:userId')
  getQuota(@Param('userId') userId: string) {
    return this.svc.getQuota(userId);
  }

  @Post('quota')
  setQuota(@Body() body: { userId: string; tier: 'free' | 'premium' }) {
    return this.svc.setQuota(body.userId, body.tier);
  }

  @Get('analytics/:userId')
  analytics(@Param('userId') userId: string) {
    return this.svc.getAnalytics(userId);
  }

  @Post('reset/:userId')
  reset(@Param('userId') userId: string) {
    return this.svc.resetQuota(userId);
  }

  @Post('whitelist')
  whitelist(@Body() body: { userId: string; whitelisted: boolean }) {
    return this.svc.whitelist(body.userId, body.whitelisted);
  }
}
