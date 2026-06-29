import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('streams')
  listStreams() {
    return this.appService.listStreams();
  }

  @Post('streams')
  createStream(@Body() body: { title: string; channelId: string; broadcaster: string }) {
    return this.appService.createStream(body.title, body.channelId, body.broadcaster);
  }

  @Post('channels/:channelId/join')
  joinChannel(@Param('channelId') channelId: string, @Body() body: { viewerId: string }) {
    return this.appService.joinChannel(channelId, body.viewerId);
  }

  @Post('channels/:channelId/leave')
  leaveChannel(@Param('channelId') channelId: string, @Body() body: { viewerId: string }) {
    return this.appService.leaveChannel(channelId, body.viewerId);
  }

  @Post('channels/:channelId/chat')
  chat(@Param('channelId') channelId: string, @Body() body: { viewerId: string; message: string }) {
    return this.appService.postChat(channelId, body.viewerId, body.message);
  }
}
