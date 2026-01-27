import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { AuthModule } from './auth/auth.module';
import { createClient } from 'redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WebsocketGateway,
    {
      provide: 'REDIS_PUB_CLIENT',
      useFactory: () => {
        const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        client.connect();
        return client;
      },
    },
    {
      provide: 'REDIS_SUB_CLIENT',
      useFactory: () => {
        const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
        client.connect();
        return client;
      },
    },
  ],
})
export class AppModule {}
