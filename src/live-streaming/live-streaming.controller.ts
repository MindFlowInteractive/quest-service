import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import { LiveStreamingService } from './live-streaming.service';
import { LiveStreamStatus } from './entities/live-stream.entity';
import { CreateStreamDto } from './dto/create-stream.dto';
import { JoinStreamDto } from './dto/join-stream.dto';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ModerateStreamDto } from './dto/moderate-stream.dto';

/**
 * The caller's identity is taken from `x-user-id`. The service enforces that the
 * caller is the host or an assigned moderator; wiring this header to the JWT
 * guard is an integration decision for the gateway, not a streaming concern.
 */
@ApiTags('Live Streaming')
@ApiHeader({ name: 'x-user-id', required: true })
@Controller('live-streaming')
export class LiveStreamingController {
  constructor(private readonly service: LiveStreamingService) {}

  @Post('streams')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a live stream' })
  create(@Headers('x-user-id') userId: string, @Body() dto: CreateStreamDto) {
    return this.service.createStream(this.requireUser(userId), dto);
  }

  @Get('streams')
  @ApiOperation({ summary: 'List streams, newest first' })
  list(@Query('status') status?: string) {
    return this.service.listStreams(status as LiveStreamStatus | undefined);
  }

  @Get('streams/:id')
  @ApiOperation({ summary: 'Get one stream' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getStream(id);
  }

  @Post('streams/:id/start')
  @ApiOperation({ summary: 'Start a stream (host only)' })
  start(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.startStream(id, this.requireUser(userId));
  }

  @Post('streams/:id/end')
  @ApiOperation({ summary: 'End a stream (host only)' })
  end(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.endStream(id, this.requireUser(userId));
  }

  @Post('streams/:id/cancel')
  @ApiOperation({ summary: 'Cancel a stream (host only)' })
  cancel(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.cancelStream(id, this.requireUser(userId));
  }

  @Post('streams/:id/viewers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Join a stream as a spectator' })
  join(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JoinStreamDto,
  ) {
    return this.service.joinStream(id, this.requireUser(userId), dto);
  }

  @Delete('streams/:id/viewers/me')
  @ApiOperation({ summary: 'Leave a stream' })
  async leave(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.leaveStream(id, this.requireUser(userId));
    return { left: true };
  }

  @Get('streams/:id/viewers/count')
  @ApiOperation({ summary: 'Current spectator count' })
  count(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getViewerCount(id).then((count) => ({ count }));
  }

  @Patch('streams/:id/quality')
  @ApiOperation({ summary: 'Adapt a spectator quality to measured bandwidth' })
  quality(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('bandwidthKbps') bandwidthKbps: number,
  ) {
    return this.service.selectQuality(
      id,
      this.requireUser(userId),
      bandwidthKbps,
    );
  }

  @Post('streams/:id/chat')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Post a chat message' })
  chat(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChatMessageDto,
  ) {
    return this.service.postMessage(id, this.requireUser(userId), dto.content);
  }

  @Get('streams/:id/chat')
  @ApiOperation({ summary: 'Recent chat history' })
  history(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getChatHistory(
      id,
      limit ? Number.parseInt(limit, 10) : 50,
    );
  }

  @Post('streams/:id/moderation')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Moderate a stream (host or moderator)' })
  moderate(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateStreamDto,
  ) {
    return this.service.moderate(id, this.requireUser(userId), dto);
  }

  @Get('streams/:id/moderation')
  @ApiOperation({ summary: 'Moderation log' })
  moderationLog(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getModerationLog(id);
  }

  @Post('streams/:id/recording/start')
  @ApiOperation({ summary: 'Start recording (host only)' })
  startRecording(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.startRecording(id, this.requireUser(userId));
  }

  @Post('streams/:id/recording/stop')
  @ApiOperation({
    summary: 'Stop recording and finalize the artefact (host only)',
  })
  stopRecording(
    @Headers('x-user-id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.stopRecording(id, this.requireUser(userId));
  }

  @Get('streams/:id/analytics')
  @ApiOperation({ summary: 'Viewership and chat analytics' })
  analytics(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getAnalytics(id);
  }

  private requireUser(userId: string): string {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return userId;
  }
}
