import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Replay, PrivacyLevel } from './entities/replay.entity';
import { Action } from './entities/action.entity';
import { Recording } from './entities/recording.entity';
import { ReplayModule } from './replay/replay.module';
import { StorageModule } from './storage/storage.module';
import { CompressionModule } from './compression/compression.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USER') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_NAME') || 'replay_service',
        entities: [Replay, Action, Recording],
        synchronize: configService.get<boolean>('TYPEORM_SYNCHRONIZE') !== false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Replay, Action, Recording]),
    ReplayModule,
    StorageModule,
    CompressionModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
