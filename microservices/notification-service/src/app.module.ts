import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';
import { GatewayModule } from './common/gateways/gateway.module';
import { AppDataSource } from './config/orm-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
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
    NotificationsModule,
    TemplatesModule,
    GatewayModule,
  ],
})
export class AppModule { }
