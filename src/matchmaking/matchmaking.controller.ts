// matchmaking.controller.ts
import { Controller, Post, Delete, Get, Req, Body } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';

@Controller('matchmaking')
export class MatchmakingController {
  constructor(private readonly service: MatchmakingService) {}

  @Post('join')
  async join(@Req() req, @Body() body: { puzzleType: string; rating: number }) {
    return this.service.joinQueue(req.user.id, body.puzzleType, body.rating);
  }

  @Delete('leave')
  async leave(@Req() req) {
    return this.service.leaveQueue(req.user.id);
  }

  @Get('status')
  async status(@Req() req) {
    return this.service.getStatus(req.user.id);
  }

  @Get('history')
  async history(@Req() req) {
    return this.service.getHistory(req.user.id);
  }
}
