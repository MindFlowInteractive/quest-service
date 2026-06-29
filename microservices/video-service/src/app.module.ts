import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoModule } from './video/video.module';
import { Encoding } from './video/entities/encoding.entity';
import { Stream } from './video/entities/stream.entity';
import { Video } from './video/entities/video.entity';
import { VideoAnalytics } from './video/entities/video-analytics.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'video_service',
      entities: [Video, Encoding, Stream, VideoAnalytics],
      synchronize: true,
    }),
    VideoModule,
  ],
})
export class AppModule {}
