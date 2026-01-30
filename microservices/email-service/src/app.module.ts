import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailsModule } from './emails/emails.module';
import { TemplatesModule } from './templates/templates.module';
import { QueueModule } from './queue/queue.module';
import { TrackingModule } from './tracking/tracking.module';
import { UnsubscribeModule } from './unsubscribe/unsubscribe.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProvidersModule } from './providers/providers.module';
import emailConfig from './config/email.config';
import { AppDataSource } from './config/orm-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig],
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    ProvidersModule,
    EmailsModule,
    TemplatesModule,
    QueueModule,
    TrackingModule,
    UnsubscribeModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
