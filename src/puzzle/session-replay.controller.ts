// session-replay.controller.ts
import { Controller, Get, Param, Req } from '@nestjs/common';
import { SessionReplayService } from './session-replay.service';

@Controller('sessions')
export class SessionReplayController {
  constructor(private readonly service: SessionReplayService) {}

  @Get(':id/replay')
  async getReplay(@Param('id') id: string, @Req() req) {
    return this.service.getReplay(id, req.user.id, req.user.role === 'admin');
  }

  @Get(':id/replay/summary')
  async getSummary(@Param('id') id: string) {
    return this.service.getSummary(id);
  }

  @Get('flagged')
  async getFlagged() {
    return this.service.flagSuspiciousSessions('hard'); // example
  }
}
