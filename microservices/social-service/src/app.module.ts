import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@quest-service/shared';
import { AppDataSource } from '@/config/orm-config';
import { FriendsModule } from '@/friends/friends.module';
import { LeaderboardsModule } from '@/leaderboards/leaderboards.module';
import { RoomsModule } from '@/rooms/rooms.module';
import { GatewayModule } from '@/common/gateways/gateway.module';
import { EventSubscriberModule } from '@/events/event-subscriber.module';
import { ServiceRegistrationService } from '@/services/service-registration.service';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    SharedModule,
    EventSubscriberModule,
    FriendsModule,
    LeaderboardsModule,
    RoomsModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ServiceRegistrationService,
  ],
})
export class AppModule {}
