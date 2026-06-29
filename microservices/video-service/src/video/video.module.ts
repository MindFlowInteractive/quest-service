import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { Encoding } from './entities/encoding.entity';
import { Stream } from './entities/stream.entity';
import { Video } from './entities/video.entity';
import { VideoAnalytics } from './entities/video-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video, Encoding, Stream, VideoAnalytics]),
  ],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}
