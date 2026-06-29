import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule } from '@quest/shared-communication';
import { EventHandlersService } from './event-handlers.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventBusModule.register({
      rabbitmq: {
        url: process.env.RABBITMQ_URL || 'localhost:5672',
        username: process.env.RABBITMQ_USER || 'admin',
        password: process.env.RABBITMQ_PASSWORD || 'rabbitmq123',
        vhost: process.env.RABBITMQ_VHOST || '/',
        heartbeat: 60,
      },
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 60000,
        backoffMultiplier: 2,
      },
      dlqPrefix: 'dlq',
      serviceName: 'consumer-service',
    }),
  ],
  providers: [EventHandlersService],
})
export class AppModule {}
