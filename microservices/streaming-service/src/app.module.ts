import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamingGateway } from './stream.gateway';
import { Stream } from './entities';
import { Channel } from './entities';
import { Viewer } from './entities';
import { ChatMessage } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'streaming_db',
      synchronize: (process.env.DB_SYNC || 'true') === 'true',
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([Stream, Channel, Viewer, ChatMessage]),
  ],
  controllers: [AppController],
  providers: [AppService, StreamingGateway],
})
export class AppModule {}
