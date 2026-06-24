import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import smsConfig from './config/sms.config';
import { SmsModule } from './sms/sms.module';
import { Sms } from './sms/entities/sms.entity';
import { Message } from './sms/entities/message.entity';
import { Receipt } from './sms/entities/receipt.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [smsConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('sms.database.host'),
        port: configService.get<number>('sms.database.port'),
        username: configService.get<string>('sms.database.user'),
        password: configService.get<string>('sms.database.password'),
        database: configService.get<string>('sms.database.name'),
        entities: [Sms, Message, Receipt],
        synchronize: configService.get<boolean>('sms.database.synchronize'),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('sms.rateLimit.windowSeconds'),
          limit: configService.get<number>('sms.rateLimit.max'),
        },
      ],
    }),
    ScheduleModule.forRoot(),
    SmsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
