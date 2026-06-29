import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('flags/:key')
  evaluateFlag(@Param('key') key: string, @Query('userId') userId: string, @Query('segment') segment?: string) {
    return this.appService.evaluateFlag(key, userId, segment);
  }

  @Post('flags')
  createFlag(@Body() body: { key: string; enabled: boolean; rollout: number; variants?: string[]; schedule?: { start?: string; end?: string } }) {
    return this.appService.createFlag(body.key, body.enabled, body.rollout, body.variants || ['control', 'variant'], body.schedule || {});
  }

  @Post('segments')
  createSegment(@Body() body: { name: string; criteria: Record<string, unknown> }) {
    return this.appService.createSegment(body.name, body.criteria);
  }

  @Post('rules')
  createRule(@Body() body: { flagKey: string; segmentName: string; enabled: boolean }) {
    return this.appService.createRule(body.flagKey, body.segmentName, body.enabled);
  }
}
