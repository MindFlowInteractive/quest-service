import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LiveStream } from './entities/live-stream.entity';
import { StreamViewer } from './entities/stream-viewer.entity';
import { StreamChatMessage } from './entities/stream-chat-message.entity';
import { StreamModerationAction } from './entities/stream-moderation-action.entity';
import { LiveStreamingService } from './live-streaming.service';
import { LiveStreamingController } from './live-streaming.controller';
import { LiveStreamingGateway } from './gateways/live-streaming.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LiveStream,
      StreamViewer,
      StreamChatMessage,
      StreamModerationAction,
    ]),
  ],
  controllers: [LiveStreamingController],
  providers: [LiveStreamingService, LiveStreamingGateway],
  exports: [LiveStreamingService],
})
export class LiveStreamingModule {}
