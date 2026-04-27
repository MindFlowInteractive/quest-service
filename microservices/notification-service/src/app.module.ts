import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SharedModule } from '@quest-service/shared';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';
import { GatewayModule } from './common/gateways/gateway.module';
import { EventSubscriberModule } from './events/event-subscriber.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ServiceRegistrationService } from './services/service-registration.service';
import { AppDataSource } from './config/orm-config';
import { 
  UserRegisteredHandler,
  PuzzleCompletedHandler,
  AchievementUnlockedHandler,
  FriendRequestSentHandler,
  FriendRequestAcceptedHandler,
  DailyChallengeAvailableHandler,
  TournamentStartingSoonHandler,
  SessionInviteReceivedHandler,
} from './event-handlers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    SharedModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    EventSubscriberModule,
    NotificationsModule,
    TemplatesModule,
    GatewayModule,
    WebhooksModule,
  ],
  providers: [
    ServiceRegistrationService,
    UserRegisteredHandler,
    PuzzleCompletedHandler,
    AchievementUnlockedHandler,
    FriendRequestSentHandler,
    FriendRequestAcceptedHandler,
    DailyChallengeAvailableHandler,
    TournamentStartingSoonHandler,
    SessionInviteReceivedHandler,
  ],
})
export class AppModule { }
